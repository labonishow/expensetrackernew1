const jwt = require("jsonwebtoken");
const AWS = require("aws-sdk");

const sequelize = require("../config/database");
const Expense = require("../models/expenseModel");
const User = require("../models/User");

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

// CREATE EXPENSE
const createExpense = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { amount, description, category,note } = req.body;
        const expense = await Expense.create(
            {
                amount,
                description,
                category,
                note,
                userId: req.user.id
            },
            {
                transaction: t
            }
        );

        const user = await User.findByPk(req.user.id, {
            transaction: t
        });

        const newTotalExpense =
            Number(user.totalExpense) + Number(amount);

        await User.update(
            {
                totalExpense: newTotalExpense
            },
            {
                where: {
                    id: req.user.id
                },
                transaction: t
            }
        );

        await t.commit();

        res.status(201).json({
            success: true,
            message: "Expense added successfully",
            expense
        });

    } catch (error) {
        console.error(error);
        await t.rollback();

        res.status(500).json({
            success: false,
            message: "Failed to add expense",
            error: error.message
        });
    }
};



const DEFAULT_PAGE_SIZE = 3;

const ALLOWED_PAGE_SIZES = [2, 3, 5, 10, 20, 30, 40];

const getExpenses = async (req, res) => {
    try {
        
        const page = Math.max(
            parseInt(req.query.page, 10) || 0,
            0
        );

       
        let pageSize =
            parseInt(req.query.pageSize, 10) || DEFAULT_PAGE_SIZE;

        if (!ALLOWED_PAGE_SIZES.includes(pageSize)) {
            pageSize = DEFAULT_PAGE_SIZE;
        }

       
        const offset = page * pageSize;

        const {
            rows: expenses,
            count: totalExpenses
        } = await Expense.findAndCountAll({
            where: {
                userId: req.user.id
            },
            order: [["createdAt", "DESC"]],
            limit: pageSize,
            offset
        });

        
        const totalPages = Math.max(
            Math.ceil(totalExpenses / pageSize),
            1
        );

    
        const validPage = Math.min(
            page,
            totalPages - 1
        );

    
        let finalExpenses = expenses;

        if (validPage !== page) {
            const result = await Expense.findAndCountAll({
                where: {
                    userId: req.user.id
                },
                order: [["createdAt", "DESC"]],
                limit: pageSize,
                offset: validPage * pageSize
            });

            finalExpenses = result.rows;
        }

        res.status(200).json({
            success: true,

            expenses: finalExpenses,

            currentPage: validPage,

            totalPages,

            totalExpenses,

            pageSize
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch expenses",
            error: error.message
        });
    }
};

// DELETE EXPENSE
const deleteExpense = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { id } = req.params;
        const expense = await Expense.findOne({
            where: {
                id: id,
                userId: req.user.id
            },
            transaction: t
        });

        if (!expense) {
            await t.rollback();

            return res.status(404).json({
                success: false,
                message: "Expense not found"
            });
        }
        const user = await User.findByPk(req.user.id, {
            transaction: t
        });
        const newTotalExpense =
            Number(user.totalExpense) - Number(expense.amount);
        await User.update(
            {
                totalExpense: newTotalExpense
            },
            {
                where: {
                    id: req.user.id
                },
                transaction: t
            }
        );
        await expense.destroy({
            transaction: t
        });
        await t.commit();

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully"
        });

    } catch (error) {
        console.error(error);

        await t.rollback();

        res.status(500).json({
            success: false,
            message: "Failed to delete expense",
            error: error.message
        });
    }
};

// Reads the user's expenses as one consistent snapshot.
async function fetchUserExpenses(userId) {
    return sequelize.transaction(async (t) => {
        return Expense.findAll({
            where: { userId },
            order: [["createdAt", "ASC"]],
            transaction: t
        });
    });
}

const downloadExpenses = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, { attributes: ["isPremium"] });

        if (!user?.isPremium) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized - premium users only"
            });
        }

        const expenses = await fetchUserExpenses(req.user.id);

        // CSV header row
        const header = "Date,Amount,Description,Category,Note";

        // One CSV line per expense. Wrapping each value in quotes and
        // escaping any quote characters inside it (" -> "") keeps commas
        // or quotes inside a description/note from breaking the columns.
        const escapeCsv = (value) => `"${String(value).replace(/"/g, '""')}"`;

        const rows = expenses.map((exp) => {
            const date = new Date(exp.createdAt).toISOString().slice(0, 10);
            return [
                escapeCsv(date),
                escapeCsv(exp.amount),
                escapeCsv(exp.description),
                escapeCsv(exp.category),
                escapeCsv(exp.note || "No note"),
            ].join(",");
        });

        const csvContent = [header, ...rows].join("\n");

        const fileKey = `expenses/${req.user.id}/expenses.csv`;

        await s3
            .putObject({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: fileKey,
                Body: csvContent,
                ContentType: "text/csv",
                ContentDisposition: "attachment; filename=\"expenses.csv\"",
                ACL: "public-read"
            })
            .promise();

        const fileUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;
        

        res.status(200).json({
            success: true,
            fileUrl
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Failed to generate file",
            error: error.message
        });
    }
};


module.exports = {
    createExpense,
    getExpenses,
    deleteExpense,
    downloadExpenses
};