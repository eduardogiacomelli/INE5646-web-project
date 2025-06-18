// js/script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Get DOM Elements ---
    const divHome = document.getElementById('divHome');
    const loginBody = document.getElementById('login-body');
    const novaContaBody = document.getElementById('nova-conta');

    // Login Form Elements
    const loginForm = loginBody.querySelector('form');
    const loginEmailInput = loginForm.querySelector('label:nth-of-type(1) + input[type="text"]');
    const loginPasswordInput = document.getElementById('login-password');
    const loginButton = document.getElementById('botaoLogin');

    // Create Account Form Elements (using more robust selection based on associated labels if IDs are not present)
    // It's still better if inputs have unique IDs. This is an attempt to select them based on your HTML structure.
    let nomeInput, sobrenomeInput, cpfInputNovaConta, emailInputNovaConta, senhaInputNovaConta, repitaSenhaInputNovaConta;

    const labelsNovaConta = novaContaBody.querySelectorAll('form > label');
    labelsNovaConta.forEach(label => {
        const nextEl = label.nextElementSibling;
        if (nextEl && nextEl.tagName === 'INPUT') {
            if (label.textContent.includes('Nome:')) nomeInput = nextEl;
            else if (label.textContent.includes('Sobrenome:')) sobrenomeInput = nextEl;
            else if (label.textContent.includes('CPF:')) cpfInputNovaConta = nextEl;
            else if (label.textContent.includes('E-mail:')) emailInputNovaConta = nextEl;
            else if (label.textContent.includes('Senha:') && !senhaInputNovaConta) senhaInputNovaConta = nextEl; // First password field
            else if (label.textContent.includes('Repita sua senha:')) repitaSenhaInputNovaConta = nextEl;
        }
    });
    const criarContaButton = novaContaBody.querySelector('input[type="button"][value="Criar conta"]');


    // Status paragraphs
    const statusNome = document.getElementById('statusNome');
    const statusSobrenome = document.getElementById('statusSobrenome');
    const statusCPF = document.getElementById('statusCPF');
    const statusEmailNovaConta = document.getElementById('statusEmail');
    const statusSenhaNovaConta = document.getElementById('statusSenha');
    const statusRepitaSenha = document.getElementById('statusRepitaSenha');

    // --- Initial State ---
    function initializePage() {
        console.log("Initializing page (AA8)...");
        mostrarApenasHome(); // This function is globally defined below
        if (loginButton) loginButton.disabled = true;
        if (criarContaButton) criarContaButton.disabled = true;
    }

    // --- Navigation Functions (called by HTML onclick attributes) ---
    window.mostrarApenasHome = () => {
        console.log("Showing Home (AA8)");
        if (divHome) divHome.style.display = 'block';
        if (loginBody) loginBody.style.display = 'none';
        if (novaContaBody) novaContaBody.style.display = 'none';
    };

    window.mostrarApenasLogin = () => {
        console.log("Showing Login (AA8)");
        if (divHome) divHome.style.display = 'none';
        if (loginBody) loginBody.style.display = 'block';
        if (novaContaBody) novaContaBody.style.display = 'none';
        resetLoginForm();
    };

    window.mostrarApenasConta = () => {
        console.log("Showing Create Account (AA8)");
        if (divHome) divHome.style.display = 'none';
        if (loginBody) loginBody.style.display = 'none';
        if (novaContaBody) novaContaBody.style.display = 'block';
        resetNovaContaForm();
    };

    // --- Form Reset Functions ---
    function resetLoginForm() {
        if (loginForm) loginForm.reset();
        if (loginPasswordInput) loginPasswordInput.type = 'password';
        if (loginButton) loginButton.disabled = true;
        console.log("Login form reset (AA8).");
    }

    function resetNovaContaForm() {
        if (novaContaForm) novaContaForm.reset();
        const statuses = [statusNome, statusSobrenome, statusCPF, statusEmailNovaConta, statusSenhaNovaConta, statusRepitaSenha];
        statuses.forEach(status => {
            if (status) {
                status.innerHTML = '';
                status.className = '';
            }
        });
        if (criarContaButton) criarContaButton.disabled = true;
        // Reset validation status object
        for (const key in novaContaValidationStatus) {
            novaContaValidationStatus[key] = false;
        }
        console.log("Create account form reset (AA8).");
    }

    // --- Status Update Utility ---
    function updateStatus(statusElement, message, isSuccess) {
        if (!statusElement) return;
        statusElement.innerHTML = ''; 

        const icon = document.createElement('i');
        icon.className = 'material-icons'; 

        if (isSuccess) {
            icon.classList.add('status-ok');
            icon.textContent = 'check_circle';
            statusElement.appendChild(icon);
            if (message) {
                 const textNode = document.createTextNode(' ' + message);
                 statusElement.appendChild(textNode);
            }
            statusElement.classList.remove('status-fail');
            statusElement.classList.add('status-ok');
        } else {
            icon.classList.add('status-fail');
            icon.textContent = 'error';
            statusElement.appendChild(icon);
            const textNode = document.createTextNode(' ' + message);
            statusElement.appendChild(textNode);
            statusElement.classList.remove('status-ok');
            statusElement.classList.add('status-fail');
        }
    }

    // --- Login Form Validation ---
    function validateLoginForm() {
        if (!loginEmailInput || !loginPasswordInput || !loginButton) return;
        const emailValid = loginEmailInput.value.trim() !== '' && loginEmailInput.value.includes('@');
        const passwordValid = loginPasswordInput.value.trim() !== '';
        loginButton.disabled = !(emailValid && passwordValid);
    }

    if (loginEmailInput) loginEmailInput.addEventListener('input', validateLoginForm);
    if (loginPasswordInput) loginPasswordInput.addEventListener('input', validateLoginForm);

    // --- Create Account Form Validation ---
    const novaContaValidationStatus = {
        nome: false,
        sobrenome: false,
        cpf: false,
        email: false,
        senhaMatch: false,
        senhaPrincipal: false
    };

    window.validaTextoEmBranco = (inputElement, statusId, fieldName) => {
        const statusElement = document.getElementById(statusId);
        if (!inputElement || !statusElement) return;

        const value = inputElement.value.trim();
        const validationKey = statusId.replace('status', '').toLowerCase();

        if (value === '') {
            updateStatus(statusElement, `${fieldName} não pode estar vazio.`, false);
            novaContaValidationStatus[validationKey] = false;
        } else {
            updateStatus(statusElement, ``, true);
            novaContaValidationStatus[validationKey] = true;
        }
        checkNovaContaFormValidity();
    };
    
    // Event listeners for fields that use validaTextoEmBranco via onblur in HTML
    // No need to add extra listeners if onblur="validaTextoEmBranco(...)" is present and works.

    function validaEmailNovaConta() {
        if (!emailInputNovaConta || !statusEmailNovaConta) return;
        const email = emailInputNovaConta.value.trim();
        const atCount = (email.match(/@/g) || []).length;

        if (email === '') {
            updateStatus(statusEmailNovaConta, 'E-mail não pode estar vazio.', false);
            novaContaValidationStatus.email = false;
        } else if (atCount !== 1) {
            updateStatus(statusEmailNovaConta, 'E-mail deve conter um único "@".', false);
            novaContaValidationStatus.email = false;
        } else {
            updateStatus(statusEmailNovaConta, '', true);
            novaContaValidationStatus.email = true;
        }
        checkNovaContaFormValidity();
    }
    if (emailInputNovaConta) emailInputNovaConta.addEventListener('input', validaEmailNovaConta); // Email validation on input

    class CPF {
        constructor(cpfString) {
            if (typeof cpfString !== 'string') throw new Error("CPF deve ser uma string.");
            this.originalCPF = cpfString;
            this.cpfLimpo = cpfString.replace(/\D+/g, '');

            if (this.cpfLimpo.length !== 11) {
                throw new Error("CPF deve conter 11 dígitos.");
            }
            if (/^(\d)\1+$/.test(this.cpfLimpo)) { // Checks if all digits are the same
                throw new Error("CPF inválido (todos os dígitos iguais).");
            }
            if (!this.validaDigitosVerificadores()) {
                throw new Error("Dígitos verificadores do CPF inválidos.");
            }
        }

        validaDigitosVerificadores() {
            let numeros = this.cpfLimpo.substring(0, 9).split('').map(Number);
            let soma = numeros.reduce((acc, num, i) => acc + num * (10 - i), 0);
            let dv1 = (soma % 11 < 2) ? 0 : 11 - (soma % 11);

            if (parseInt(this.cpfLimpo.charAt(9)) !== dv1) return false;

            numeros.push(dv1);
            soma = numeros.reduce((acc, num, i) => acc + num * (11 - i), 0);
            let dv2 = (soma % 11 < 2) ? 0 : 11 - (soma % 11);

            return parseInt(this.cpfLimpo.charAt(10)) === dv2;
        }

        getFormatado() {
            return this.cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
        }
        getValor() { 
            return this.cpfLimpo;
        }
    }

    window.validarCPF = (inputElement) => {
        if (!inputElement || !statusCPF) return;
        const cpfValue = inputElement.value;
        try {
            new CPF(cpfValue); 
            updateStatus(statusCPF, '', true);
            novaContaValidationStatus.cpf = true;
        } catch (error) {
            updateStatus(statusCPF, error.message, false);
            novaContaValidationStatus.cpf = false;
        }
        checkNovaContaFormValidity();
    };
    // Event listener for CPF if onblur="validarCPF(this)" is present in HTML.

    function validaSenhasNovaConta() {
        if (!senhaInputNovaConta || !repitaSenhaInputNovaConta || !statusSenhaNovaConta || !statusRepitaSenha) return;
        const senha = senhaInputNovaConta.value;
        const repitaSenhaVal = repitaSenhaInputNovaConta.value;

        let isSenhaPrincipalValid = false;
        let areSenhasMatching = false;

        if (senha === '') {
            updateStatus(statusSenhaNovaConta, 'Senha não pode estar vazia.', false);
            isSenhaPrincipalValid = false;
        } else {
            let strength = 'Fraca';
            let strengthOkForValidation = false;
            if (senha.length >= 10 && /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha) && /[^A-Za-z0-9]/.test(senha)) {
                strength = 'Muito Forte'; strengthOkForValidation = true;
            } else if (senha.length >= 8 && /[A-Z]/.test(senha) && /[a-z]/.test(senha) && /[0-9]/.test(senha)) {
                strength = 'Forte'; strengthOkForValidation = true;
            } else if (senha.length >= 6 && (/[A-Za-z]/.test(senha) && /[0-9]/.test(senha))) {
                strength = 'Média'; strengthOkForValidation = true; // Consider Média OK for form validity
            }
            
            updateStatus(statusSenhaNovaConta, `Força: ${strength}`, strengthOkForValidation);
            isSenhaPrincipalValid = true; // Valid if non-empty for enabling next field, actual strength is just info
        }
        novaContaValidationStatus.senhaPrincipal = isSenhaPrincipalValid;

        if (repitaSenhaVal === '' && senha !== '') {
            updateStatus(statusRepitaSenha, 'Confirmação de senha não pode estar vazia.', false);
            areSenhasMatching = false;
        } else if (senha !== repitaSenhaVal && repitaSenhaVal !== '') {
            updateStatus(statusRepitaSenha, 'As senhas não coincidem.', false);
            areSenhasMatching = false;
        } else if (senha === repitaSenhaVal && senha !== '') {
             updateStatus(statusRepitaSenha, 'Senhas coincidem.', true);
            areSenhasMatching = true;
        } else { 
            statusRepitaSenha.innerHTML = '';
            statusRepitaSenha.className = '';
             // If both are empty, they technically "match" but the form isn't valid yet.
            areSenhasMatching = (senha === '' && repitaSenhaVal === '');
        }
        // For button enabling, senhaMatch requires both passwords to be non-empty and identical.
        novaContaValidationStatus.senhaMatch = areSenhasMatching && senha !== '';

        checkNovaContaFormValidity();
    }

    if (senhaInputNovaConta) senhaInputNovaConta.addEventListener('input', validaSenhasNovaConta);
    if (repitaSenhaInputNovaConta) repitaSenhaInputNovaConta.addEventListener('input', validaSenhasNovaConta);

    function checkNovaContaFormValidity() {
        if (!criarContaButton) return;
        const allValid = novaContaValidationStatus.nome &&
                         novaContaValidationStatus.sobrenome &&
                         novaContaValidationStatus.cpf &&
                         novaContaValidationStatus.email &&
                         novaContaValidationStatus.senhaPrincipal && 
                         novaContaValidationStatus.senhaMatch;

        criarContaButton.disabled = !allValid;
    }

    class Account {
        constructor(nome, sobrenome, email, cpfObject, senha) {
            this.nome = nome;
            this.sobrenome = sobrenome;
            this.email = email;
            this.cpf = cpfObject.getValor(); // Store the cleaned CPF string
            this.senha = senha; // WARNING: In a real app, HASH this immediately!
            this.dataCriacao = new Date().toISOString();
        }
    }

    if (criarContaButton) {
        criarContaButton.addEventListener('click', () => {
            if (criarContaButton.disabled) {
                alert("Por favor, preencha e valide todos os campos obrigatórios.");
                return;
            }
            try {
                const cpfObj = new CPF(cpfInputNovaConta.value); // Final check for CPF object

                const newAccount = new Account(
                    nomeInput.value.trim(),
                    sobrenomeInput.value.trim(),
                    emailInputNovaConta.value.trim(),
                    cpfObj,
                    senhaInputNovaConta.value
                );
                console.log("Conta criada com sucesso:", newAccount);
                alert(`Conta para ${newAccount.nome} ${newAccount.sobrenome} criada com sucesso! (Objeto da conta logado no console)`);
                mostrarApenasLogin(); // As per typical flow, direct to login after successful creation
            } catch (error) {
                console.error("Erro final ao criar a conta:", error);
                alert("Erro ao criar conta: " + error.message + "\nVerifique os campos, especialmente o CPF.");
                if (error.message.toLowerCase().includes('cpf') && statusCPF) {
                    updateStatus(statusCPF, error.message, false);
                    novaContaValidationStatus.cpf = false;
                    checkNovaContaFormValidity();
                }
            }
        });
    }
    
    // --- Final Initialization ---
    initializePage();
});
