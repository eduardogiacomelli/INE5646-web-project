function mostrarSenha() {
    const loginPasswordInput = document.getElementById('login-password');
    if (loginPasswordInput) {
        loginPasswordInput.type = 'text';
    }
}

function ocultarSenha() {
    const loginPasswordInput = document.getElementById('login-password');
    if (loginPasswordInput) {
        loginPasswordInput.type = 'password';
    }
}
