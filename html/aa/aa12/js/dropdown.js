function mostrarMenu(menuId) {
    //https://javascript.info/bubbling-and-capturing
    event.stopPropagation(); // Prevent window.onclick from closing it immediately
    
    // Close other dropdowns first
    closeAllDropdowns(menuId);

    document.getElementById(menuId).classList.toggle("show");
}
 
// Fecha o menu quando o usuário clica fora dele
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        closeAllDropdowns();
    }
}

function closeAllDropdowns(exceptMenuId = null) {
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (exceptMenuId && openDropdown.id === exceptMenuId) {
            continue; // Don't close the one we might be trying to toggle
        }
        if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
        }
    }
}
