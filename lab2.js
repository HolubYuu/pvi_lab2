if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
  
          caches.open('pwa-cache-v1').then(function(cache) {
            cache.keys().then(function(requests) {
              console.log('Cached requests:', requests);
            });
          }).catch(function(error) {
            console.error('Error opening cache:', error);
          });
        })
        .catch(function(error) {
          console.error('Service Worker registration failed:', error);
        });
    });
  }

document.addEventListener("DOMContentLoaded", function () {
    // DOM Elements
    const menu = document.querySelector('#small-menu');
    const menuLinks = document.querySelector('.nav-menu');
    const sidebar = document.querySelector('#sidebar');
    const sidebarMenu = document.querySelector('#sidebar-menu');
    const notificationIcon = document.querySelector('.notification-container img[alt="Notifications"]');
    const accountIcon = document.querySelector('.nav-links img[alt="Account"]');
    const notificationsPopup = document.getElementById('notifications-popup');
    const accountPopup = document.getElementById('account-popup');
    const pageLinks = document.querySelectorAll('.page-link');
    const pages = document.querySelectorAll('.page');
    const bellIcon = document.querySelector(".notification-icon");
    const notificationContainer = document.querySelector('.notification-container');
    const logo = document.getElementById("navbar-logo");
    
    let clickCount = 0;
    let clickTimer;

    
    // Show selected page function
    function showPage(pageId) {
        pages.forEach(page => {
            page.style.display = (page.id === pageId) ? "block" : "none"; 
        })
        pageLinks.forEach(link => {
            link.classList.toggle("active", link.dataset.page === pageId); 
        });
    
        if (pageId === "message") {
            notificationContainer.classList.add('no-notification');  
            bellIcon.style.pointerEvents = "none";
            notificationsPopup.style.display = "none";
            localStorage.setItem("notificationCleared", "true"); 
        } else {
            if (!localStorage.getItem("notificationCleared")) {
                notificationContainer.classList.add("notification-container"); 
            }
            bellIcon.style.pointerEvents = "auto";
        }
    }    

    // Show initial page
    showPage("students");

    // Handle page link clicks
    pageLinks.forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            showPage(this.dataset.page); 
        });
    });

    // Handle Logo click (go back to students page)
    if (logo) {
        logo.addEventListener("click", function () {
            showPage("students");
        });
    }

    // Handle Bell Icon Click
    if (bellIcon) {
        bellIcon.addEventListener("click", function (event) {
            event.preventDefault();
            clickCount++;

            bellIcon.style.animation = "none";
            void bellIcon.offsetWidth; 
            bellIcon.style.animation = "bell-animation 1s ease-in-out";

            if (clickCount === 1) {
                notificationsPopup.style.display = "block";
                clickTimer = setTimeout(() => {
                    clickCount = 0;
                }, 1000);
            } else if (clickCount === 2) {
                showPage("message");
                notificationsPopup.style.display = "none";
                clearTimeout(clickTimer);
                clickCount = 0;
            }
        });
    }

    // Handle menu toggle for small screen
    menu.addEventListener('click', function () {
        menu.classList.toggle('is-active');
        menuLinks.classList.toggle('active');
    });

    // Handle sidebar menu toggle
    sidebarMenu.addEventListener('click', function () {
        sidebar.classList.toggle('active');
        sidebarMenu.classList.toggle('is-active');
    });

    // Handle sidebar link clicks
    const sidebarLinks = document.querySelectorAll('.sidebar ul li a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function () {
            const pageId = link.getAttribute('data-page');
            pages.forEach(page => page.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
            sidebar.classList.remove('active');
            sidebarMenu.classList.remove('is-active');
        });
    });

    // Pop-up display handling
    function showPopup(popup) {
        popup.style.display = 'block';
    }

    function hidePopup(popup) {
        setTimeout(() => {
            if (!popup.matches(':hover')) {
                popup.style.display = 'none';
            }
        }, 200);
    }

    // Notifications Hover Events
    notificationIcon.addEventListener('mouseenter', function () {
        showPopup(notificationsPopup);
        accountPopup.style.display = 'none';
    });

    notificationsPopup.addEventListener('mouseleave', function () {
        hidePopup(notificationsPopup);
    });

    // Account Hover Events
    accountIcon.addEventListener('mouseenter', function () {
        showPopup(accountPopup);
        notificationsPopup.style.display = 'none';
    });

    accountPopup.addEventListener('mouseleave', function () {
        hidePopup(accountPopup);
    });
});


document.addEventListener("DOMContentLoaded", function () {
    const overlay = document.getElementById("overlay");
    const modal = document.querySelector(".modal");
    const deleteModal = document.querySelector(".delete-student-modal");

    const form = modal.querySelector(".modal-content");

    const addIcon = document.querySelector(".add-icon");
    const deleteIcon = document.querySelector(".bulk-delete-icon");
    
    const closeButtons = document.querySelectorAll(".close");
    const cancelButtons = document.querySelectorAll(".cancel-btn");

    const tableBody = document.querySelector(".students-table tbody");

    const deleteConfirmBtn = document.querySelector(".delete-student-modal button[type='submit']");
    const deleteCancelBtn = document.querySelector(".delete-student-modal button.cancel-btn");

    const modalSubmitBtn = document.getElementById("modal-submit-btn");
    const modalName = document.getElementById("modal-name");

    let isBulkDelete = false; 

    let studentCounter = tableBody.querySelectorAll("tr").length+1;
    const valText= document.getElementById("validation-text");

    // Open add modal when add icon is clicked
    addIcon.addEventListener("click", () => {
        modal.style.display = "flex";
        overlay.style.display = "block";
        modalSubmitBtn.innerText=`Add`;
        modalName.innerText=`Add student`;
    });

    // Close modals 
    closeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            modal.style.display = "none";
            deleteModal.style.display = "none";
            overlay.style.display = "none";
        });
    });

    // Cancel button closes modals
    cancelButtons.forEach(button => {
        button.addEventListener("click", (e) => {
            e.preventDefault(); 
            modal.style.display = "none";
            deleteModal.style.display = "none"; 
            overlay.style.display = "none";
        });
    });


    let isEditMode = false;
    let currentRow = null;

    // Add or edit
    form.addEventListener("submit", function (e) {
        e.preventDefault();
    
        const group = document.getElementById("group").value.trim();
        let name = document.getElementById("name").value.trim();
        const gender = document.getElementById("gender").value;
        const birthday = document.getElementById("birthday").value;

        const groupRegex = /^[А-Яа-яA-Za-z0-9\-\s]{4,10}$/;
        const nameRegex = /^[А-Яа-яA-Za-z'’\s\-]{4,30}$/;
        const today = new Date();
    
        if (!group || !name || !birthday) {
            alert("Please fill all required fields.");
            return;
        }

        if (!groupRegex.test(group)) {
            alert("Enter group, 4-10 symbols");
            return;
        }

        if (!nameRegex.test(name)) {
            alert("Enter name, 4-30 symbols");
            return;
        }
        
    // Two words for name
    const nameParts = name.split(" ").filter(part => part.length > 0);
    if (nameParts.length !== 2) {
        alert("Name must contain exactly two words.");
        return;
    }

    // Upper letter for name parts
    name = nameParts.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");

    const birthDate = new Date(birthday);
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    const dayCheck = (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) ? 1 : 0;
    const realAge = age - dayCheck;

    if (realAge < 10 || realAge > 100) {
        alert("Age must be between 10 and 100 years.");
        return;
    }



        if (isEditMode) {
             // Editing mode
        const cells = currentRow.querySelectorAll("td");
        const oldGroup = cells[1].textContent.trim();
        const oldName = cells[2].textContent.trim();
        const oldGender = cells[3].textContent.trim();
        const oldBirthday = cells[4].textContent.trim();

        // Check if any value has changed
        let updatedStudent = false;

        if (group !== oldGroup) {
            cells[1].textContent = group;
            updatedStudent = true;
        }
        if (name !== oldName) {
            cells[2].textContent = name;
            updatedStudent = true;
        }
        if (gender !== oldGender) {
            cells[3].textContent = gender;
            updatedStudent = true;
        }
        if (birthday !== oldBirthday) {
            cells[4].textContent = birthday;
            updatedStudent = true;
        }

        if (updatedStudent) {
            // Collect the updated row as a student object
            const updatedRow = {
                id: currentRow.getAttribute("student-id"),
                group: cells[1].textContent.trim(),
                name: cells[2].textContent.trim(),
                gender: cells[3].textContent.trim(),
                birthday: cells[4].textContent.trim(),
                status: 'Active'  // assuming status doesn't change
            };

            // Console JSON output for the updated row
            const jsonData = JSON.stringify([updatedRow], null, 2);
            console.log(jsonData);
        }

        modal.style.display = "none"; 
        overlay.style.display = "none"; 
        form.reset(); 
        } 
        else {
            const newRow = document.createElement("tr");
            newRow.innerHTML = `
                <td><input type="checkbox" class="checkbox" aria-label="select check"></td>
                <td>${group}</td>
                <td>${name}</td>
                <td>${gender}</td>
                <td>${birthday}</td>
                <td><div class="status-circle green"></div></td>
                <td>
                    <div class="edit-icon"><img src="images/pencil.png" alt="Edit"></div>
                    <div class="delete-icon"><img src="images/trash-bin_cute.png" alt="Trash"></div>
                </td>
            `;
    
            tableBody.appendChild(newRow); 
            const newId = studentCounter++;
            newRow.setAttribute("student-id", newId); 
            document.getElementById("student-id").value = newId; 
            form.reset(); 
            modal.style.display = "none"; 
            overlay.style.display = "none"; 
            setTimeout(function() {
            alert(`Student with ID: ${newId} added`);},1000);

            const newStudent = {
                id: newId,
                group: group,
                name: name,
                gender: gender,
                birthday: birthday,
                status: 'Active'  
            };
    
            // Console JSON output for the new row
            const jsonData = JSON.stringify([newStudent], null, 2);
            console.log(jsonData);
        }
    
        isEditMode = false;
    
        const totalRows = document.querySelectorAll(".students-table tbody tr").length;
        currentPage = Math.ceil(totalRows / rowsPerPage);
        createPagination();
        displayPage(currentPage);
    });


    tableBody.addEventListener("click", function (e) {
        if (e.target.closest(".edit-icon")) {
            const row = e.target.closest("tr");
            currentRow = row;
            isEditMode = true;

            // Get current values from the row
            const cells = row.querySelectorAll("td");
            const group = cells[1].textContent.trim();
            const name = cells[2].textContent.trim();
            const gender = cells[3].textContent.trim();
            const birthday = cells[4].textContent.trim();

            // Fill the edit form inputs
            document.getElementById("group").value = group;
            document.getElementById("name").value = name;
            document.getElementById("gender").value = gender;
            document.getElementById("birthday").value = birthday;

            // Show the modal
            modal.style.display = "flex";
            overlay.style.display = "block";
            modalSubmitBtn.innerText=`Edit`;
            modalName.innerText=`Edit student`;
        }

        else if (e.target.closest(".delete-icon")) {
            const row = e.target.closest("tr");
            const name = row.querySelectorAll("td")[2].textContent.trim();
    
            currentRow = row;
    
            document.getElementById("delete-text").innerText = `Are you sure you want to delete ${name}?`;

            // Show the modal
            deleteModal.style.display = "block";
            overlay.style.display = "block";
            isBulkDelete = false;
        }
    });


    // Confirm delete
    deleteConfirmBtn.addEventListener("click", function () {
        if (isBulkDelete) {
            // Delete all checked rows
            const checkedRows = tableBody.querySelectorAll(".checkbox:checked");
            checkedRows.forEach(checkbox => {
                const row = checkbox.closest("tr");
                row.remove();
            });
        } else if (currentRow) {
            // Delete the specific row
            currentRow.remove();
            currentRow = null;
        }

        deleteModal.style.display = "none";
        overlay.style.display = "none";
        checkDeleteIcon(); 

        const totalRows = document.querySelectorAll(".students-table tbody tr").length;
        currentPage = Math.ceil(totalRows / rowsPerPage); 
        createPagination();
        displayPage(currentPage);
    });
    
    // Cancel delete
    deleteCancelBtn.addEventListener("click", function () {
        currentRow = null;
        deleteModal.style.display = "none";
        overlay.style.display = "none";
    });

    // Check if any checkbox is checked to show the bulk delete icon
    function checkDeleteIcon() {
        const checkboxes = tableBody.querySelectorAll(".checkbox");
        const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    
        if (anyChecked) {
            deleteIcon.style.display = "block"; 
            document.getElementById("delete-text").textContent = `Are you sure you want to delete students?`;
        } else {
            deleteIcon.style.display = "none";
        }
    }

    // Listen for checkbox changes to show or hide the bulk delete icon
    tableBody.addEventListener("change", function (e) {
        if (e.target.classList.contains("checkbox")) {
            checkDeleteIcon();
        }
    });

    // Trigger the delete modal from the bulk delete icon
    deleteIcon.addEventListener("click", () => {
        deleteModal.style.display = "block";
        overlay.style.display = "block";
        isBulkDelete = true; 
    });
});





const rowsPerPage = 5;
let currentPage = 1;

const table = document.querySelector('.students-table');
const tbody = document.querySelector('.students-table tbody'); 
const paginationContainer = document.querySelector('#pagination');

const rows = Array.from(tbody.rows);

// Function to display the correct page
function displayPage(page) {
    const rows = document.querySelectorAll(".students-table tbody tr");
    
    rows.forEach((row, index) => {
        row.style.display = "none"; 
        if (index >= (page - 1) * rowsPerPage && index < page * rowsPerPage) {
            row.style.display = "table-row";
        }
    });

    updateActiveButton();
}


// Function to create pagination buttons
function createPagination() {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = ""; 

    const rows = document.querySelectorAll(".students-table tbody tr");
    const pageCount = Math.ceil(rows.length / rowsPerPage);

    for (let i = 1; i <= pageCount; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.classList.add("pagination-btn");

        if (i === currentPage) {
            button.classList.add("active");
        }

        button.addEventListener("click", function () {
            currentPage = i;
            displayPage(currentPage);
            updateActiveButton();
        });

        paginationContainer.appendChild(button);
    }
}

// Highlight the active page button
function updateActiveButton() {
    document.querySelectorAll(".pagination-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.querySelectorAll(".pagination-btn")[currentPage - 1].classList.add("active");
}


document.addEventListener("DOMContentLoaded", function () {
    createPagination();
    displayPage(currentPage);
});