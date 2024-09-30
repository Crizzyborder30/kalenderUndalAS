document.addEventListener("DOMContentLoaded", () => {

    const port = window.location.origin; //"http://localhost:3000"

    const table = document.getElementById("projectTable");
    const row = table.insertRow(0);
    const firstCell = document.createElement("th");
    row.appendChild(firstCell);

    //loading weeks
    fetch(`${port}/weekNumber`)
        .then(response => response.json())
        .then(weeks => {
            console.log(weeks);
            const week0 = weeks.currentWeek;
            const week1 = weeks.nextWeek;
            const week2 = weeks.weekAfterNext;

            for (let i = 0; i < 3; i++) {
                const cell = document.createElement("th");
                cell.classList.add("weekNumber");
                cell.colSpan = 5;
                cell.textContent = "Uke " + eval(`week${i}`)
                row.appendChild(cell);
            }
        })
        .catch(error => console.error('Error fetching weekNumber:', error));


    function startScrollingUp() {
        // Start scrolling oppover hvis ikke allerede gjort
        if (!scrollInterval) {
            scrollInterval = setInterval(() => {
                window.scrollBy(0, -10); // Scroll oppover
            }, 20); // Rull hvert 20ms
        }
    }

    function stopScrolling() {
        // Stopp scrolling
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    }

    const initializeDraggable = (element) => {
        element.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", e.target.id);
        });

    }
    // Global dragover-event listener for å håndtere auto-scrolling
    document.addEventListener('dragover', (e) => {
        e.preventDefault(); // Forhindrer standard håndtering av dragover

        const scrollMargin = 50; // Område der scroll aktiveres (50px fra toppen/bunnen)
        const scrollSpeed = 10; // Hvor raskt siden skal rulle

        if (e.clientY < scrollMargin) {
            window.scrollBy(0, -scrollSpeed);
        } else if (e.clientY > window.innerHeight - scrollMargin) {
            window.scrollBy(0, scrollSpeed);
        }
    });

    const initializeDropzone = (cell) => {
        cell.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        cell.addEventListener("drop", (e) => {
            e.preventDefault();


            const employeeCode = e.dataTransfer.getData("text/plain");
            const element = document.getElementById(employeeCode);
            const cellPosition = cell.cellIndex - 1;
            //eks: Motland2 eller Varhaug Stasjon5
            const newCellId = [cell.id, cellPosition];

            if (element) {
                const previousCell = element.parentElement;
                const previousProjectName = previousCell.id;
                const previousCellPosition = previousCell.cellIndex - 1;
                //eks: Motland2 eller Varhaug Stasjon5
                const previousCellId = [previousProjectName, previousCellPosition];

                const elementId = element.id;

                console.log(previousCellId + newCellId + elementId);
                console.log(previousCellPosition + " + " + cellPosition);
                if (previousCellPosition === cellPosition) {
                    previousCell.removeChild(element);
                    cell.appendChild(element);
                    updateCellContent(previousCellId, newCellId, elementId);
                }
                else {
                    alert("Det kan bare være en utgave av hver ansatt for hver dag")
                }
            }
        });
    };


    const loadGrid = async () => {
        const data = await getData();

        const response = await fetch(`${port}/weekNumber`);
        const weeks = await response.json();
        console.log(weeks);
        const currentWeek = await weeks.currentWeek;

        //if a new week has begun, remove the content in the old week
        if (data.savedWeek !== currentWeek) {
            data.projects.forEach(project => {
                project.projectEmployees = project.projectEmployees.slice(5);

            })

            data.savedWeek = currentWeek;
            console.log(data);
            postUpdates(data);

        }
        else {
            //array with objects
            const employees = data.employees;
            const temporaryStorageForDraggables = document.getElementById("temporaryStorageForDraggables");

            //making draggable elements for each employee and placing them in the temporary storage
            if (employees) {
                employees.forEach(async employee => {

                    for (let i = 0; i <= 14; i++) {
                        const draggable = document.createElement("div");
                        draggable.textContent = employee.name;
                        const color = employee.color
                        const backgroundColor = color + "70";
                        draggable.style = `border: 2px solid ${color}; background-color: ${backgroundColor}`;



                        draggable.classList.add("draggable");
                        draggable.draggable = "true";
                        draggable.id = employee.code + i;
                        initializeDraggable(draggable);
                        temporaryStorageForDraggables.appendChild(draggable);
                    }
                })
            }
            //array with arrays, containing all employees that has been placed at a project
            let allPlacedEmployees = [];

            //makes a new row for each project saved
            data.projects.forEach((project) => {

                const projectName = project.projectName;
                console.log(projectName);
                //array with arrays, containing employee codes which are placed there that day
                const projectEmployees = project.projectEmployees;
                const row = document.createElement("tr");
                table.appendChild(row);
                const firstCell = document.createElement("td");
                const removeRowButton = document.createElement("button");
                removeRowButton.id = "removeButton";
                removeRowButton.innerHTML = "X";
                firstCell.innerHTML = projectName;
                firstCell.appendChild(removeRowButton);
                firstCell.classList.add("firstCell");
                firstCell.id = projectName;
                row.appendChild(firstCell);
                const backgroundColor = project.projectColor + "99";
                row.style =
                    `background-color: ${backgroundColor}; border-left: 2px solid black; border-bottom: 2px solid ${project.projectColor};`;

                removeRowButton.onclick = function () {
                    removeProject(removeRowButton); // Send knappen selv som argument
                };
                let placedEmployees = []



                //makes 15 new cells for each project
                for (let i = 0; i <= 14; i++) {
                    const cellId = projectName;
                    let cell = document.createElement("td");
                    cell.id = cellId;
                    cell.classList.add("dropzone");
                    initializeDropzone(cell);
                    row.appendChild(cell);


                    let placed = [];

                    //places the draggables in the rigth cell, and logs which employees has been placed

                    if (projectEmployees[i]) {
                        projectEmployees[i].forEach(employee => {
                            //employee is the employee code
                            const contentId = employee + i;

                            console.log(projectName + " " + contentId);
                            const element = document.getElementById(contentId);
                            if (element) {
                                console.log("elements exists");
                                console.log(element);
                                cell.appendChild(element);
                                placed = [...placed, employee];
                                console.log("placed");
                                console.log(placed);
                            }



                        })
                    }
                    placedEmployees = [...placedEmployees, placed];

                }

                allPlacedEmployees = [...allPlacedEmployees, placedEmployees];

            });

            let placedEmployees = [];

            //combines all the arrays containing data of the placed employees, to make one array with arrays, where the subarrays 
            //contain all the employees that are placed somewhere in that cell id. (practically speaking, this means that an employee
            //only can be placed one place per day)
            for (let i = 0; i < 15; i++) {
                const projectPlacedEmployees = [];
                for (const arr of allPlacedEmployees) {
                    if (arr[i] !== undefined) {
                        projectPlacedEmployees.push(...arr[i]);
                    }
                }

                const noDupes = Array.from(new Set(projectPlacedEmployees));
                placedEmployees.push(noDupes);
            }

            let startPositionsContent = [];

            //fills startPositionContent with the employees that havent been placed somewhere, so that they can be placed in the 
            //starting position
            console.log("placedemloyees");
            console.log(placedEmployees);
            placedEmployees.forEach(placedEmployee => {
                const content = employees.filter(employee => !placedEmployee.includes(employee.code))
                    //converts the result from filter, so that content is the employee code instead of the whole object
                    .map(employee => employee.code);
                console.log(content);
                startPositionsContent = [...startPositionsContent, content];
            })

            console.log("startPositionsContent");
            console.log(startPositionsContent);
            const startPositions = document.createElement("tr");
            startPositions.style.border = "2px solid black";
            const emptyCell = document.createElement("th");
            emptyCell.textContent = "Ledig:";
            startPositions.appendChild(emptyCell);

            //creates and fills all starting positions
            for (let i = 0; i <= 14; i++) {
                const startPosition = document.createElement("td");
                startPosition.id = "startPosition";
                startPosition.classList.add("dropzone");
                initializeDropzone(startPosition);

                startPositionsContent[i].forEach(content => {
                    const elementId = content + i;

                    const element = document.getElementById(elementId);

                    if (element) {
                        startPosition.appendChild(element);
                    }
                })

                startPositions.appendChild(startPosition);
            }

            table.appendChild(startPositions);



        }

    };

    const postUpdates = (data) => {
        fetch(`${port}/positions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(response => response.text())
            .then(result => {
                console.log(result);
                // Oppdater siden automatisk etter at endringene er lagret
                window.location.reload(); // Refresher hele siden
            }
           
        )
            .catch(error => console.error('Error:', error));
    }


    //runs whenever an element is dropped, or if a cell is added/removed
    const updateCellContent = (previousCellId //0 = projectname and 1 = cellIndex
        , newCellId, //0 = projectname and 1 = cellIndex
        draggableId //Kristian0 eller Alf Magne11
    ) => {
        fetch(`${port}/positions`)
            .then(response => response.json())
            .then(data => {
                const prevProjectName = previousCellId[0];
                console.log("prevProjectName: " + prevProjectName);



                const newProjectName = newCellId[0];
                console.log("newProjectName: " + newProjectName);


                const draggableName = draggableId.replace(/[0-9]/g, "");
                console.log("draggableName: " + draggableName);

                const draggableNumber = draggableId.match(/\d+/);
                console.log("draggableNumber: " + draggableNumber);

                const prevProjectIndex = data.projects.findIndex(project => project.projectName === prevProjectName);
                console.log("prevProjectIndex: " + prevProjectIndex);


                const newProjectIndex = data.projects.findIndex(project => project.projectName === newProjectName);
                console.log("newProjectIndex: " + newProjectIndex);



                //if the element is moved from another project
                if (prevProjectName != "startPosition") {
                    console.log(prevProjectIndex + " " + draggableNumber + " " + draggableName);
                    const index = data.projects[prevProjectIndex].projectEmployees[draggableNumber].indexOf(draggableName);

                    // Remove the employee from the previous project
                    if (index !== -1) {
                        data.projects[prevProjectIndex].projectEmployees[draggableNumber].splice(index, 1);
                    }

                    //and then if the element is dropped in a new project, and not to the startPosition
                    if (newProjectName != "startPosition") {
                        console.log(newProjectIndex + " " + draggableNumber);

                        //check if theres an array for the new cell, and creates one if there isnt
                        if (!data.projects[newProjectIndex].projectEmployees[draggableNumber]) {
                            data.projects[newProjectIndex].projectEmployees[draggableNumber] = [];
                        }
                        //then add the employee to the new project
                        data.projects[newProjectIndex].projectEmployees[draggableNumber].push(draggableName);
                    }


                }
                else if (prevProjectName === newProjectName) {

                }
                //if the element is coming from the start position, we dont have to remove it, as the content of start positions is
                //based on which elements are not placed in other projects
                else {
                    //still have to check, and create an array for the new cell
                    if (!data.projects[newProjectIndex].projectEmployees[draggableNumber]) {
                        data.projects[newProjectIndex].projectEmployees[draggableNumber] = [];
                    }
                    //and then add the employee
                    console.log("dgnr " + draggableNumber);
                    data.projects[newProjectIndex].projectEmployees[draggableNumber].push(draggableName);

                    console.log(data.projects[newProjectIndex].projectEmployees[draggableNumber]);
                }

                console.log(data);
                //updates the json file
                postUpdates(data);

            });
    };

    const getData = async () => {
        const response = await fetch(`${port}/positions`);
        const data = await response.json();
        return data;
    }

    const colors = ["#00ffff", "#7fffd4", "#7fff00", "#ff7f50", "#b8060b", "#bdb76b", "#556b2f", "#8fbc8f", "#cd5c5c", "#e6e6fa", "#fffacd", "#20b2aa", "#ba55d3", "#dda0dd", "#c0c0c0", "#708090", "#dc143c", "#ff8c00", "#ff1496", "#228b22", "#ff69b4", "#800000", "#0000cd", "#ff4500", "#bc8f8f", "#2e8b57", "#d2bf8c"];


    const shuffleArray = (array) => {
        // Copy the array to avoid mutating the original array
        let shuffledArray = array.slice();

        // Fisher-Yates shuffle algorithm
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swap elements i and j
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        //console.log(shuffledArray);
        return shuffledArray;
    };

    const addRandomColor = async () => {
        const data = await getData();
        const usedColorsRow = data.projects.map(project => project.projectColor);
        const usedColorsDiv = data.employees.map(employee => employee.color);
        let usedColors = usedColorsRow.concat(usedColorsDiv);


        const shuffledColors = shuffleArray(colors);
        console.log(shuffledColors);
        console.log(usedColors);
        const usableColors = shuffledColors.filter(color => !usedColors.includes(color));
        console.log(usableColors);

        if (usableColors.length > 0) {
            console.log(usableColors[0]);
            return usableColors[0]; // Returner første tilgjengelige farge
        } else {
            return null; // Returner null dersom alle farger er brukt
        }
    }

    const showAddProjectDiv = document.getElementById("showAddProjectDiv");
    const addProjectDiv = document.getElementById("addProjectDiv");
    const addProjectButton = document.getElementById("addProject");
    const cancelAddProjectButton = document.getElementById("cancelAddProject");
    const projectNameInput = document.getElementById("projectName");

    const showAddEmployeeDiv = document.getElementById("showAddEmployeeDiv");
    const addEmployeeDiv = document.getElementById("addEmployeeDiv");
    const addEmployeeButton = document.getElementById("addEmployee");
    const cancelAddEmployeeButton = document.getElementById("cancelAddEmployee");
    const employeeNameInput = document.getElementById("employeeName");

    const showRemoveEmployeeDiv = document.getElementById("showRemoveEmployeeDiv");
    const removeEmployeeDiv = document.getElementById("removeEmployeeDiv");
    const removeEmployeeButton = document.getElementById("removeEmployeeButton");
    const cancelEmployeeRemovalButton = document.getElementById("cancelEmployeeRemoval");
    const employeesDiv = document.getElementById("employeeDiv");

    const showAddProject = () => {
        addProjectDiv.style = "display: block";
        addEmployeeDiv.style = "display: none";
        removeEmployeeDiv.style = "display: none";
    }

    const addProject = async () => {
        const projectName = projectNameInput.value;
        console.log("projectName " + projectName);
        const data = await getData();
        const nameIsInUse = data.projects.map(project => project.projectName)
            .includes(projectName);
        console.log(nameIsInUse);
        if (projectName !== "" && !nameIsInUse) {
            const row = document.createElement("tr");
            const firstCell = document.createElement("td");
            const rowCount = table.rows.length - 2;
            console.log("rowCount " + rowCount);

            const removeRowButton = document.createElement("button");
            removeRowButton.id = "removeButton";
            removeRowButton.innerHTML = "Fjern";
            firstCell.innerHTML = projectName;
            firstCell.classList.add("firstCell");
            firstCell.id = projectName;
            firstCell.appendChild(removeRowButton);
            row.appendChild(firstCell);
            table.insertBefore(row, table.children[rowCount]);
            const backgroundColor = await addRandomColor();

            if (backgroundColor) {
                row.style.backgroundColor = backgroundColor;
            }

            removeRowButton.onclick = function () {
                removeProject(removeRowButton); // Send knappen selv som argument
            };
            // Lag 15 nye celler for hver rad
            for (let i = 0; i <= 14; i++) {
                const cellId = projectName;
                let cell = document.createElement("td");
                cell.id = cellId;
                cell.classList.add("dropzone");
                initializeDropzone(cell);
                row.appendChild(cell);
            }
            console.log("backgroundcolor " + backgroundColor);

            const newProject = {
                projectName: projectName,
                projectColor: backgroundColor,
                projectEmployees: []
            }

            data.projects.push(newProject);
            console.log(data.projects);

            postUpdates(data);

            projectNameInput.value = "";

        } else {
            alert("Gi prosjektet et unikt navn!");
        }
    }

    const cancelAddProject = () => {
        addProjectDiv.style = "display: none";
    }

    showAddProjectDiv.addEventListener("click", showAddProject);
    addProjectButton.addEventListener("click", addProject);
    cancelAddProjectButton.addEventListener("click", cancelAddProject);

    //remove project
    const removeProject = async (button) => {
        const row = button.parentNode.parentNode;
        console.log(row);
        const cell = button.parentNode;
        console.log(cell);
        const projectName = cell.id;
        console.log(projectName);
        table.removeChild(row);


        const data = await getData();

        console.log(data.projects);
        data.projects = data.projects.filter(project => project.projectName !== projectName);

        console.log(data.projects);


        postUpdates(data);
       




    }



    const showAddEmployee = () => {
        addEmployeeDiv.style = "display: block";
        addProjectDiv.style = "display: none";
        removeEmployeeDiv.style = "display: none";

    }

    const addEmployee = async () => {
        const employeeName = employeeNameInput.value;
        if (employeeName != "") {
            const data = await getData();

            const usedCodes = data.employees.map(employee => employee.code);
            const characters = 'abcdefghijklmnopqrstuvwxyz';
            const number = Math.random() * 5 + 5;
            let generatedCode = "";
            const generateCode = () => {
                for (let i = 0; i < number; i++) {
                    generatedCode += characters.charAt(Math.floor(Math.random() * characters.length));
                }
            }
            generateCode();


            const color = await addRandomColor();
            console.log("usedcodes");
            console.log(usedCodes);
            const employeeData = {
                name: employeeName,
                code: generatedCode,
                color: color
            };
            console.log(data.employees);
            data.employees.push(employeeData);
            console.log(data.employees);

            postUpdates(data);
        }
        else {
            alert("Du må di den ansatte et navn!");
        }


    }

    const cancelAddEmployee = () => {
        addEmployeeDiv.style = "display: none";
    }

    showAddEmployeeDiv.addEventListener("click", showAddEmployee);
    addEmployeeButton.addEventListener("click", addEmployee);
    cancelAddEmployeeButton.addEventListener("click", cancelAddEmployee);





    let selectedDivs = [];


    const showAndCreateRemoveEmployeeDiv = async () => {
        console.log("test");
        removeEmployeeDiv.style = "display: block";
        addProjectDiv.style = "display: none";
        addEmployeeDiv.style = "display: none";

        const data = await getData();
        const employees = data.employees;
        console.log(employees);

        employees.forEach(employee => {
            const div = document.createElement("div");
            div.id = employee.code;
            div.textContent = employee.name;
            const color = employee.color;
            const backgroundColor = color + "90";
            div.style = `background-color: ${backgroundColor}; border: 2px solid ${color}`;
            div.addEventListener('click', () => {
                // Toggle "selected" class for styling
                console.log("klikket");
                div.classList.toggle('selected');

                // Legger til eller fjerner fra selectedDivs array
                console.log(selectedDivs);
                console.log(div.id);
                if (selectedDivs.includes(div.id)) {
                    selectedDivs = selectedDivs.filter(selectedDiv => selectedDiv != div.id);
                } else {
                    selectedDivs.push(div.id);
                }
                console.log(selectedDivs);
            });
            employeesDiv.appendChild(div);
        })
    }

    const removeEmployee = async () => {
        const data = await getData();
        console.log("lol");
        console.log(data.employees);

        data.employees = data.employees.filter(employee => !selectedDivs.includes(employee.code));


        console.log(data.employees);
        console.log(data);

        postUpdates(data);

    }

    const cancelEmployeeRemoval = () => {

        removeEmployeeDiv.style = "display: none";
        employeesDiv.innerHTML = "";
        selectedDivs = [];
    }

    showRemoveEmployeeDiv.addEventListener("click", showAndCreateRemoveEmployeeDiv);
    removeEmployeeButton.addEventListener("click", removeEmployee);
    cancelEmployeeRemovalButton.addEventListener("click", cancelEmployeeRemoval);



    const newWeek = async () => {
        const data = await getData();

        data.projects.forEach(project => {
            project.projectEmployees.slice(5);

        })
        postUpdates(data);
        loadGrid();
    }









    loadGrid();


    document.querySelectorAll(".dropzone").forEach(initializeDropzone);
});