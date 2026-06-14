backendserver='https://spendsmart-backend-ce6i.onrender.com/';
const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const form = event.target;
            const formData = new FormData(form);

            const payload = new URLSearchParams();
            for (const [key, value] of formData.entries()) {
                payload.append(key, value);
            }

            try {
                const response = await fetch(backendserver+'auth/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    credentials: 'include',
                    body: payload.toString()
                });

                if (response.ok) {
                    // Handle success (e.g., redirect to dashboard)
                    const data = await response.json();
                    // Delete any cookies available
                    //logout();
                    // Save token to cookie
                    //document.cookie = `access_token=${data.access_token}; path=/;max-age=2592000; SameSite=None; Secure=true`;
                    //window.location.href = '/dashboard.html'; // Change this to your desired redirect page
                    setTimeout(() => {
                        window.location.href = "/dashboard.html";
                    }, 0);
                } else {
                    // Handle error
                    const errorData = await response.json();
                    alert(`Error: ${errorData.detail}`);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }
const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const form = event.target;
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            if (data.password !== data.password2) {
                alert("Passwords do not match");
                return;
            }

            const payload = {
                email: data.email,
                username: data.username,
                name: data.name,
                phonenumber: data.phonenumber,
                password: data.password
            };

            try {
                const response = await fetch(backendserver+'auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    showToast("Registration is successful.", "success")
                    setTimeout(() => window.location.href = 'login.html', 2800);

                } else {
                    // Handle error
                    const errorData = await response.json();
                    //alert(`Error: ${errorData.message}`);
                    showToast(errorData,'error')
                }
            } catch (error) {
                console.error('Error:', error);
                showToast('An error occurred. Please try again.','error');
            }
        });
    }

function logout() {
    // Get all cookies
    const cookies = document.cookie.split(";");

    // Iterate through all cookies and delete each one
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        // Set the cookie's expiry date to a past date to delete it
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    // Redirect to the login page
    window.location.href = '/auth/login-page';
    };
let toastTimer;
function showToast(msg, type='success') {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  document.getElementById('toast-icon').textContent = type === 'success' ? '✓' : '✕';
  t.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}