document.addEventListener('DOMContentLoaded', () => {
    console.log("AA12 Script Initializing...");

    // --- DOM Elements ---
    const divHome = document.getElementById('divHomeAA12');
    const divLogin = document.getElementById('divLoginAA12');
    const divNovaConta = document.getElementById('divNovaContaAA12');
    const divLoggedInContent = document.getElementById('divLoggedInContentAA12');
    const allSections = [divHome, divLogin, divNovaConta, divLoggedInContent];

    // Nav buttons
    const homeBtnNav = document.getElementById('homeBtnNav');
    const userMenuBtn = document.getElementById('userMenuBtn'); // For the dropdown itself
    const loginLinkNav = document.getElementById('loginLinkNav');
    const createAccountLinkNav = document.getElementById('createAccountLinkNav');
    const userMenuText = document.getElementById('userMenuText'); // To update to "Usuário" or "Sair"

    // Login Form
    const loginForm = document.getElementById('loginFormAA12');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginButton = document.getElementById('loginButtonAA12');

    // Nova Conta Form
    const novaContaForm = document.getElementById('novaContaFormAA12');
    const inputNome = document.getElementById('inputNome');
    const inputSobrenome = document.getElementById('inputSobrenome');
    const inputCPF = document.getElementById('inputCPF');
    const inputEmailNovaConta = document.getElementById('inputEmailNovaConta');
    const inputCEP = document.getElementById('inputCEP');
    const inputLogradouro = document.getElementById('inputLogradouro');
    const inputNumeroEndereco = document.getElementById('inputNumeroEndereco');
    const inputComplemento = document.getElementById('inputComplemento');
    const inputBairro = document.getElementById('inputBairro');
    const inputMunicipio = document.getElementById('inputMunicipio');
    const inputUF = document.getElementById('inputUF');
    const inputSenhaNovaConta = document.getElementById('inputSenhaNovaConta');
    const novaContaPasswordToggle = document.getElementById('novaContaPasswordToggle');
    const inputRepitaSenha = document.getElementById('inputRepitaSenha');
    const repitaSenhaPasswordToggle = document.getElementById('repitaSenhaPasswordToggle');
    const criarContaButton = document.getElementById('criarContaButtonAA12');

    // Status messages
    const statusNome = document.getElementById('statusNome');
    const statusSobrenome = document.getElementById('statusSobrenome');
    const statusCPF = document.getElementById('statusCPF');
    const statusEmail = document.getElementById('statusEmail');
    const statusCEPMessage = document.getElementById('statusCEPMessage');
    const statusNumero = document.getElementById('statusNumero');
    const statusSenha = document.getElementById('statusSenha');
    const statusRepitaSenha = document.getElementById('statusRepitaSenha');

    // Logged In Content
    const loggedInUserNameSpan = document.getElementById('loggedInUserName');
    const selectUF_IBGE = document.getElementById('selectUF_IBGE');
    const selectMunicipio_IBGE = document.getElementById('selectMunicipio_IBGE');
    const logoutButton = document.getElementById('logoutButtonAA12');

    document.getElementById('currentYear').textContent = new Date().getFullYear();

    // --- Page State & Mock User Storage ---
    let loggedInUser = null; // Store { email, nome } of logged in user
    const mockUserStorageKey = 'aa12RegisteredUsers';

    function getRegisteredUsers() {
        return JSON.parse(localStorage.getItem(mockUserStorageKey)) || [];
    }

    function saveRegisteredUser(user) {
        const users = getRegisteredUsers();
        users.push(user); // user should contain at least email and password (hashed in real app)
        localStorage.setItem(mockUserStorageKey, JSON.stringify(users));
    }

    // --- Navigation & Section Visibility ---
    function showSection(sectionToShow) {
        allSections.forEach(section => {
            if (section) section.classList.remove('active-section');
        });
        if (sectionToShow) {
            sectionToShow.classList.add('active-section');
            console.log(`Showing section: ${sectionToShow.id}`);
        }
        closeAllDropdowns(); // Close nav dropdown if open
    }

    function showHome() {
        showSection(divHome);
        updateNavUserMenu();
    }
    function showLogin() {
        showSection(divLogin);
        if(loginForm) loginForm.reset();
        if(loginButton) loginButton.disabled = true;
        resetPasswordVisibility(loginPasswordInput, loginPasswordToggle);
        console.log("Login form reset and shown.");
    }
    function showNovaConta() {
        showSection(divNovaConta);
        if(novaContaForm) novaContaForm.reset();
        resetPasswordVisibility(inputSenhaNovaConta, novaContaPasswordToggle);
        resetPasswordVisibility(inputRepitaSenha, repitaSenhaPasswordToggle);
        clearAllStatusMessages();
        if(criarContaButton) criarContaButton.disabled = true;
        console.log("Nova Conta form reset and shown.");
    }
    function showLoggedInContent() {
        showSection(divLoggedInContent);
        if (loggedInUser && loggedInUserNameSpan) {
            loggedInUserNameSpan.textContent = loggedInUser.nome || loggedInUser.email;
        }
        loadUFs_IBGE(); // Load UFs when this section is shown
        updateNavUserMenu();
    }

    homeBtnNav.addEventListener('click', showHome);
    loginLinkNav.addEventListener('click', (e) => { e.preventDefault(); showLogin(); });
    createAccountLinkNav.addEventListener('click', (e) => { e.preventDefault(); showNovaConta(); });
    userMenuBtn.addEventListener('click', () => mostrarMenu('accountDropdown')); // From dropdown.js

    function updateNavUserMenu() {
        if (loggedInUser) {
            loginLinkNav.style.display = 'none';
            createAccountLinkNav.innerHTML = 'Sair (Logout)';
            createAccountLinkNav.onclick = (e) => { e.preventDefault(); handleLogout(); };
            if (userMenuText) userMenuText.textContent = loggedInUser.nome.split(' ')[0] || 'Usuário'; // Show first name or "Usuário"
        } else {
            loginLinkNav.style.display = 'block';
            createAccountLinkNav.innerHTML = 'Criar Conta';
            createAccountLinkNav.onclick = (e) => { e.preventDefault(); showNovaConta(); };
            if (userMenuText) userMenuText.textContent = 'Conta';
        }
    }
    
    function handleLogout() {
        loggedInUser = null;
        showHome(); // Or showLogin()
        console.log("User logged out.");
    }
    if (logoutButton) logoutButton.addEventListener('click', handleLogout);


    // --- Password Visibility Toggle ---
    function setupPasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);
        let passwordWasVisibleOnFocus = false; // Specific to this input

        if (passwordInput && toggleIcon) {
            toggleIcon.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    toggleIcon.textContent = 'visibility_off';
                    passwordWasVisibleOnFocus = true;
                } else {
                    passwordInput.type = 'password';
                    toggleIcon.textContent = 'visibility';
                    passwordWasVisibleOnFocus = false;
                }
            });
            passwordInput.addEventListener('blur', () => {
                if (passwordWasVisibleOnFocus) {
                    passwordInput.type = 'password';
                    toggleIcon.textContent = 'visibility';
                    passwordWasVisibleOnFocus = false;
                }
            });
        }
    }
    function resetPasswordVisibility(passwordInput, toggleIcon) {
        if (passwordInput && toggleIcon) {
            passwordInput.type = 'password';
            toggleIcon.textContent = 'visibility';
        }
    }

    setupPasswordToggle('loginPassword', 'loginPasswordToggle');
    setupPasswordToggle('inputSenhaNovaConta', 'novaContaPasswordToggle');
    setupPasswordToggle('inputRepitaSenha', 'repitaSenhaPasswordToggle');

    // --- Status Update Utility ---
    function updateStatus(statusElement, message, isSuccess) {
        if (!statusElement) return;
        statusElement.innerHTML = '';
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.classList.add(isSuccess ? 'status-ok' : 'status-fail');
        icon.textContent = isSuccess ? 'check_circle' : 'error';
        statusElement.appendChild(icon);
        if (message) {
            statusElement.appendChild(document.createTextNode(' ' + message));
        }
        statusElement.className = 'status-message ' + (isSuccess ? 'status-ok' : 'status-fail');
    }
    function clearStatus(statusElement) {
        if (statusElement) {
            statusElement.innerHTML = '';
            statusElement.className = 'status-message';
        }
    }
    function clearAllStatusMessages() {
        [statusNome, statusSobrenome, statusCPF, statusEmail, statusCEPMessage, statusNumero, statusSenha, statusRepitaSenha]
            .forEach(el => clearStatus(el));
    }

    // --- CPF Class and Validation (from AA8) ---
    class CPF {
        constructor(cpfString) {
            if (typeof cpfString !== 'string') throw new Error("CPF deve ser uma string.");
            this.originalCPF = cpfString;
            this.cpfLimpo = cpfString.replace(/\D+/g, '');

            if (this.cpfLimpo.length !== 11) {
                throw new Error("CPF deve conter 11 dígitos.");
            }
            if (/^(\d)\1+$/.test(this.cpfLimpo)) {
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
        getFormatado() { return this.cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4"); }
        getValor() { return this.cpfLimpo; }
    }

    // --- Account Class (extended for address) ---
    class Account {
        constructor(data) {
            this.nome = data.nome;
            this.sobrenome = data.sobrenome;
            this.email = data.email;
            this.cpf = data.cpfObject.getValor(); // Store cleaned CPF
            this.senha = data.senha; // WARNING: HASH IN REAL APP
            this.cep = data.cep;
            this.logradouro = data.logradouro;
            this.numeroEndereco = data.numeroEndereco;
            this.complemento = data.complemento;
            this.bairro = data.bairro;
            this.municipio = data.municipio;
            this.uf = data.uf;
            this.dataCriacao = new Date().toISOString();
        }
    }
    
    // --- Login Form Logic ---
    if (loginForm) {
        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log("Tentativa de login...");
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value; // In real app, send to server to check hashed pass
            const users = getRegisteredUsers();
            const foundUser = users.find(user => user.email === email && user.senha === password); // Simple check

            if (foundUser) {
                loggedInUser = { email: foundUser.email, nome: foundUser.nome }; // Store some user info
                console.log("Login bem-sucedido para:", loggedInUser);
                showLoggedInContent();
            } else {
                alert("E-mail ou senha inválidos.");
                console.log("Falha no login.");
            }
        });
        [loginEmailInput, loginPasswordInput].forEach(input => {
            if(input) input.addEventListener('input', () => {
                if(loginButton) loginButton.disabled = !(loginEmailInput.value && loginPasswordInput.value);
            });
        });
    }

    // --- Nova Conta Form - Field Validation States ---
    const ncValid = { // Nova Conta Validation states
        nome: false, sobrenome: false, cpf: false, email: false, cep: false, /*numero: true, // Optional*/
        senhaPrincipal: false, senhaMatch: false
    };

    function checkAllNovaContaValid() {
        const allValid = Object.values(ncValid).every(val => val === true);
        if(criarContaButton) criarContaButton.disabled = !allValid;
        // console.log("Nova Conta validity:", ncValid, "Button disabled:", criarContaButton.disabled);
    }

    // Generic text input validation (not empty)
    function validateTextInput(input, statusEl, fieldNameKey, fieldDisplayName) {
        if (!input || !statusEl) return;
        const value = input.value.trim();
        if (value === '') {
            updateStatus(statusEl, `${fieldDisplayName} é obrigatório.`, false);
            ncValid[fieldNameKey] = false;
        } else {
            updateStatus(statusEl, '', true);
            ncValid[fieldNameKey] = true;
        }
        checkAllNovaContaValid();
    }

    if(inputNome) inputNome.addEventListener('blur', () => validateTextInput(inputNome, statusNome, 'nome', 'Nome'));
    if(inputSobrenome) inputSobrenome.addEventListener('blur', () => validateTextInput(inputSobrenome, statusSobrenome, 'sobrenome', 'Sobrenome'));
    if(inputNumeroEndereco) inputNumeroEndereco.addEventListener('blur', () => { // Numero is optional for validity check but can have its own validation
        if (inputNumeroEndereco.value.trim() === '') {
            clearStatus(statusNumero); // Or updateStatus(statusNumero, "Número é recomendado", true/some_info_status)
            // ncValid.numero = true; // Assuming number is optional for overall form validity
        } else {
            updateStatus(statusNumero, '', true);
            // ncValid.numero = true;
        }
        // checkAllNovaContaValid(); // Only if number impacts overall validity
    });


    if(inputEmailNovaConta) inputEmailNovaConta.addEventListener('blur', () => {
        if (!inputEmailNovaConta || !statusEmail) return;
        const email = inputEmailNovaConta.value.trim();
        const atCount = (email.match(/@/g) || []).length;
        if (email === '') {
            updateStatus(statusEmail, 'E-mail é obrigatório.', false);
            ncValid.email = false;
        } else if (atCount !== 1) {
            updateStatus(statusEmail, 'E-mail inválido (deve conter um "@").', false);
            ncValid.email = false;
        } else {
            updateStatus(statusEmail, '', true);
            ncValid.email = true;
        }
        checkAllNovaContaValid();
    });

    if(inputCPF) inputCPF.addEventListener('blur', () => {
        if (!inputCPF || !statusCPF) return;
        try {
            new CPF(inputCPF.value);
            updateStatus(statusCPF, '', true);
            ncValid.cpf = true;
        } catch (e) {
            updateStatus(statusCPF, e.message, false);
            ncValid.cpf = false;
        }
        checkAllNovaContaValid();
    });

    // Password validation for Nova Conta
    function validateNovaContaPasswords() {
        const senha = inputSenhaNovaConta.value;
        const repita = inputRepitaSenha.value;
        let isSenhaPrincipalOk = false;
        let doSenhasMatchOk = false;

        if (senha === '') {
            updateStatus(statusSenha, 'Senha é obrigatória.', false);
        } else {
            // Basic strength indication (can be expanded)
            let strengthMsg = "Força: Fraca";
            if (senha.length >= 8) strengthMsg = "Força: Média";
            if (senha.length >= 10 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)) strengthMsg = "Força: Forte";
            updateStatus(statusSenha, strengthMsg, true); // Considered "ok" if non-empty
            isSenhaPrincipalOk = true;
        }
        ncValid.senhaPrincipal = isSenhaPrincipalOk;

        if (isSenhaPrincipalOk) { // Only validate repeat if main password is set
            if (repita === '') {
                updateStatus(statusRepitaSenha, 'Confirme sua senha.', false);
            } else if (senha === repita) {
                updateStatus(statusRepitaSenha, 'Senhas coincidem.', true);
                doSenhasMatchOk = true;
            } else {
                updateStatus(statusRepitaSenha, 'As senhas não coincidem.', false);
            }
        } else {
            clearStatus(statusRepitaSenha); // Clear if main password is empty
        }
        ncValid.senhaMatch = doSenhasMatchOk;
        checkAllNovaContaValid();
    }
    if(inputSenhaNovaConta) inputSenhaNovaConta.addEventListener('input', validateNovaContaPasswords);
    if(inputRepitaSenha) inputRepitaSenha.addEventListener('input', validateNovaContaPasswords);

    // --- ViaCEP Auto-completion ---
    if (inputCEP) {
        inputCEP.addEventListener('blur', async () => {
            const cep = inputCEP.value.replace(/\D/g, '');
            clearStatus(statusCEPMessage); // Clear previous CEP status
            ncValid.cep = false; // Reset CEP validity

            if (cep.length === 8) {
                updateStatus(statusCEPMessage, 'Buscando CEP...', true); // Indicate loading
                try {
                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                    if (!response.ok) throw new Error(`Servidor ViaCEP retornou erro ${response.status}`);
                    const data = await response.json();

                    if (data.erro) {
                        updateStatus(statusCEPMessage, 'CEP não encontrado.', false);
                        clearAddressFields();
                    } else {
                        inputLogradouro.value = data.logradouro || '';
                        inputBairro.value = data.bairro || '';
                        inputMunicipio.value = data.localidade || '';
                        inputUF.value = data.uf || '';
                        updateStatus(statusCEPMessage, 'Endereço carregado!', true);
                        ncValid.cep = true; // CEP is valid if address is found
                        // Potentially focus on 'numero' field
                        if (inputNumeroEndereco) inputNumeroEndereco.focus();
                    }
                } catch (error) {
                    console.error("ViaCEP Error:", error);
                    updateStatus(statusCEPMessage, `Erro ao buscar CEP. (${error.message})`, false);
                    clearAddressFields();
                }
            } else if (cep.length > 0) {
                updateStatus(statusCEPMessage, 'CEP inválido (8 dígitos numéricos).', false);
                clearAddressFields();
            } else {
                 clearStatus(statusCEPMessage); // If field is cleared by user
            }
            checkAllNovaContaValid();
        });
    }
    function clearAddressFields() {
        inputLogradouro.value = ''; inputBairro.value = ''; inputMunicipio.value = ''; inputUF.value = '';
    }
    
    // --- Nova Conta Form Submission ---
    if (novaContaForm) {
        novaContaForm.addEventListener('submit', (event) => {
            event.preventDefault();
            console.log("Submetendo formulário de Nova Conta...");
            checkAllNovaContaValid(); // Final check
            if (criarContaButton.disabled) {
                alert("Por favor, corrija os erros no formulário.");
                return;
            }

            try {
                const cpfObject = new CPF(inputCPF.value); // This will throw if CPF is invalid
                const accountData = {
                    nome: inputNome.value.trim(),
                    sobrenome: inputSobrenome.value.trim(),
                    email: inputEmailNovaConta.value.trim(),
                    cpfObject: cpfObject,
                    senha: inputSenhaNovaConta.value, // Store plain for mock login
                    cep: inputCEP.value.replace(/\D/g, ''),
                    logradouro: inputLogradouro.value,
                    numeroEndereco: inputNumeroEndereco.value.trim(),
                    complemento: inputComplemento.value.trim(),
                    bairro: inputBairro.value,
                    municipio: inputMunicipio.value,
                    uf: inputUF.value
                };
                const newAccount = new Account(accountData);
                saveRegisteredUser(newAccount); // Save for mock login

                console.log("Nova conta criada (localStorage & console):", newAccount);
                alert("Conta criada com sucesso! Você será redirecionado para o login.");
                showLogin();

            } catch (error) { // Catch CPF error mostly
                console.error("Erro na submissão do formulário Nova Conta:", error);
                alert(`Erro: ${error.message}`);
                if (error.message.includes('CPF') && statusCPF) { // Highlight CPF error
                     updateStatus(statusCPF, error.message, false);
                     ncValid.cpf = false;
                     checkAllNovaContaValid();
                }
            }
        });
    }

    // --- IBGE Localidades API ---
    async function loadUFs_IBGE() {
        if (!selectUF_IBGE) return;
        selectUF_IBGE.innerHTML = '<option value="">Carregando UFs...</option>';
        selectMunicipio_IBGE.innerHTML = '<option value="">Selecione um Estado</option>';
        selectMunicipio_IBGE.disabled = true;
        console.log("Carregando UFs IBGE...");
        try {
            const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
            if (!response.ok) throw new Error(`API IBGE (UFs) erro ${response.status}`);
            const ufs = await response.json();
            
            selectUF_IBGE.innerHTML = '<option value="">Selecione um Estado</option>'; // Reset
            ufs.forEach(uf => {
                const option = document.createElement('option');
                option.value = uf.id; // Using ID for fetching municipios
                option.textContent = `${uf.nome} (${uf.sigla})`;
                selectUF_IBGE.appendChild(option);
            });
            console.log("UFs carregadas.");
        } catch (error) {
            console.error("Erro ao carregar UFs IBGE:", error);
            selectUF_IBGE.innerHTML = `<option value="">Falha ao carregar UFs</option>`;
        }
    }

    async function loadMunicipios_IBGE(ufId) {
        if (!selectMunicipio_IBGE || !ufId) {
            selectMunicipio_IBGE.innerHTML = '<option value="">Selecione um Estado</option>';
            selectMunicipio_IBGE.disabled = true;
            return;
        }
        selectMunicipio_IBGE.disabled = true;
        selectMunicipio_IBGE.innerHTML = '<option value="">Carregando municípios...</option>';
        console.log(`Carregando municípios IBGE para UF ID: ${ufId}...`);
        try {
            const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${ufId}/municipios?orderBy=nome`);
            if (!response.ok) throw new Error(`API IBGE (Municípios) erro ${response.status}`);
            const municipios = await response.json();

            selectMunicipio_IBGE.innerHTML = '<option value="">Selecione um Município</option>'; // Reset
            municipios.forEach(municipio => {
                const option = document.createElement('option');
                option.value = municipio.id;
                option.textContent = municipio.nome;
                selectMunicipio_IBGE.appendChild(option);
            });
            selectMunicipio_IBGE.disabled = false;
            console.log("Municípios carregados.");
        } catch (error) {
            console.error("Erro ao carregar municípios IBGE:", error);
            selectMunicipio_IBGE.innerHTML = `<option value="">Falha ao carregar municípios</option>`;
        }
    }

    if (selectUF_IBGE) {
        selectUF_IBGE.addEventListener('change', (event) => {
            const selectedUfId = event.target.value;
            if (selectedUfId) {
                loadMunicipios_IBGE(selectedUfId);
            } else {
                selectMunicipio_IBGE.innerHTML = '<option value="">Selecione um Estado</option>';
                selectMunicipio_IBGE.disabled = true;
            }
        });
    }

    // --- Initial Page Setup ---
    showHome(); // Start on the home page
    updateNavUserMenu(); // Set initial state of nav user menu
});
