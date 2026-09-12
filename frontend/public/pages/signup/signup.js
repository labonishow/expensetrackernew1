const SIGNUP_URL = `${API_BASE_URL}/users/signup`;

async function handleFormSubmit(event) {
    event.preventDefault();

    const name = event.target.name.value;
    const email = event.target.email.value;
    const password = event.target.password.value;

    const obj = { name, email, password };

    try {
        const response = await axios.post(SIGNUP_URL, obj);

        console.log("Signup successful:", response.data);

        event.target.reset();

    } catch (error) {
        if (error.response && error.response.status === 403) {
            console.log("User already exists");

            event.target.reset();

        
        } else {
            console.error("Signup failed:", error);
        }
    }
}


const LOGIN_URL = `${API_BASE_URL}/users/login`;

async function handleLogin(event) {
event.preventDefault();


const email = event.target.email.value.trim();
const password = event.target.password.value;

const obj = {
    email,
    password
};

try {

    const response = await axios.post(LOGIN_URL, obj);

    console.log("Login successful:", response.data);

    if (response.data.success) {

        
        localStorage.setItem("token", response.data.token);

        console.log(
            "Token saved:",
            localStorage.getItem("token")
        );

    
        event.target.reset();

        window.location.href = "../expense/expense.html";

    } else {

        document.getElementById("loginError").innerHTML =
            `<div style="color:red;">
                ${response.data.message}
            </div>`;
    }

} catch (error) {

    console.error(
        "Login failed:",
        error.response?.data || error.message
    );

    document.getElementById("loginError").innerHTML =
        `<div style="color:red;">
            ${error.response?.data?.message || error.message}
        </div>`;

    event.target.reset();
}


}


const FORGOT_PASSWORD_URL = `${API_BASE_URL}/password/forgotpassword`;

document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
    const form = document.getElementById("forgotPasswordForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
});

async function handleForgotPassword(event) {
    event.preventDefault();

    const email = event.target.email.value.trim();
    const messageEl = document.getElementById("forgotPasswordMessage");

    try {
        const response = await axios.post(FORGOT_PASSWORD_URL, { email });

        messageEl.style.color = "green";
        messageEl.textContent = response.data.message;

        event.target.reset();

    } catch (error) {
        console.error("Forgot password failed:", error.response?.data || error.message);

        messageEl.style.color = "red";
        messageEl.textContent = error.response?.data?.message || "Something went wrong";
    }
}