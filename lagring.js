document.addEventListener("DOMContentLoaded", () => {



    const table = document.getElementById("projectTable");
    const row = table.insertRow(0);
    const firstCell = document.createElement("td");
    row.appendChild(firstCell);

    //loading weeks
    fetch('http://localhost:3000/weekNumber')
        .then(response => response.json())
        .then(weeks => {
            console.log(weeks);
            const week0 = weeks.currentWeek;
            const week1 = weeks.nextWeek;
            const week2 = weeks.weekAfterNext;

            for (let i = 0; i < 3; i++) {
                const cell = document.createElement("td");
                cell.classList.add("weekNumber");
                cell.colSpan = 5;
                cell.textContent = "Uke " + eval(`week${i}`)
                row.appendChild(cell);
            }
        })
        .catch(error => console.error('Error fetching weekNumber:', error));


    const initializeDraggable = (element) => {
        element.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", e.target.id);
        });
    }

    const initializeDropzone = (cell) => {
        cell.addEventListener("dragover", (e) => {
            e.preventDefault();
        });

        cell.addEventListener("drop", (e) => {
            e.preventDefault();


            const employeeName = e.dataTransfer.getData("text/plain");
            const element = document.getElementById(employeeName);
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

    const colors = ["red", "yellow", "green", "blue", "orange", "pink", "purple"];
    let usedColors = [];

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

    const addColors = (row, index) => {
        const shuffledColors = shuffleArray(colors);
        if (usedColors.includes(shuffledColors[index])) {
            addColors(row, index);
        }
        else {
            row.style.backgroundColor = shuffledColors[index];
            usedColors.push(shuffledColors[index]);
        }

    }


    const loadGrid = () => {
        fetch('http://localhost:3000/positions')
            .then(response => response.json())
            .then(data => {

                const employees = data.employees;
                const temporaryStorageForDraggables = document.getElementById("temporaryStorageForDraggables");

                //making draggable elements for each employee and placing them in the temporary storage
                employees.forEach(employeeName => {
                    for (let i = 0; i <= 14; i++) {
                        const draggable = document.createElement("div");
                        draggable.id = employeeName + i;
                        draggable.classList.add("draggable");
                        draggable.draggable = "true";
                        draggable.textContent = employeeName;
                        initializeDraggable(draggable);

                        temporaryStorageForDraggables.appendChild(draggable);
                    }
                })

                //array with arrays, containing all employees that has been placed at a project
                let allPlacedEmployees = [];

                //makes a new row for each project saved
                data.projects.forEach((project, index) => {

                    const projectName = project.projectName;
                    console.log(projectName);
                    //array with arrays, containing employees which are placed there that day
                    const projectEmployees = project.projectEmployees;
                    const row = document.createElement("tr");
                    table.appendChild(row);
                    const firstCell = document.createElement("td");
                    const removeRowButton = document.createElement("button");
                    removeRowButton.id = "removeButton";
                    removeRowButton.innerHTML = "Fjern prosjekt";
                    firstCell.innerHTML = projectName;
                    firstCell.appendChild(removeRowButton);
                    firstCell.id = projectName;
                    row.appendChild(firstCell);

                    removeRowButton.onclick = function () {
                        removeProject(removeRowButton); // Send knappen selv som argument
                    };
                    let placedEmployees = []

                    addColors(row, index);

                    //makes 15 new cells for each project
                    for (let i = 0; i <= 14; i++) {
                        const cellId = projectName;
                        let cell = document.createElement("td");
                        cell.id = cellId;
                        cell.classList.add("dropzone");
                        cell.textContent = cellId;
                        initializeDropzone(cell);
                        row.appendChild(cell);


                        let placed = [];

                        //places the draggables in the rigth cell, and logs which employees has been placed
                        console.log("projectEmployees[i]");
                        console.log(projectEmployees[i]);
                        if (projectEmployees[i]) {
                            projectEmployees[i].forEach(employee => {
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
                placedEmployees.forEach(placedEmployee => {
                    const content = employees.filter(employee => !placedEmployee.includes(employee));
                    startPositionsContent = [...startPositionsContent, content];
                })


                const startPositions = document.createElement("tr");
                const emptyCell = document.createElement("td");
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


            })
            .catch(error => console.error('Error fetching positions:', error));
    };

    const postUpdates = (data) => {
        fetch('http://localhost:3000/positions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }).then(response => response.text())
            .then(result => console.log(result))
            .catch(error => console.error('Error:', error));
    }

    const updateEmployees = (newEmployees) => {

        fetch('http://localhost:3000/positions')
            .then(response => response.json())
            .then(data => {
                //array
                data.employees = newEmployees;

                postUpdates(data);

            })
    };




    //runs whenever an element is dropped, or if a cell is added/removed
    const updateCellContent = (previousCellId //0 = projectname and 1 = cellIndex
        , newCellId, //0 = projectname and 1 = cellIndex
        draggableId //Kristian0 eller Alf Magne11
    ) => {
        fetch('http://localhost:3000/positions')
            .then(response => response.json())
            .then(data => {
                const prevProjectName = previousCellId[0];
                console.log("prevProjectName: " + prevProjectName);



                const newProjectName = newCellId[0];
                console.log("newProjectName: " + newProjectName);


                const draggableName = draggableId.replace(/[0-9]/g, "");
                console.log("draggableName: " + draggableName);

                const draggableNumber = draggableId.match(/\d/);
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
                //if the element is coming from the start position, we dont have to remove it, as the content of start positions is
                //based on which elements are not placed in other projects
                else {
                    //still have to check, and create an array for the new cell
                    if (!data.projects[newProjectIndex].projectEmployees[draggableNumber]) {
                        data.projects[newProjectIndex].projectEmployees[draggableNumber] = [];
                    }
                    //and then add the employee
                    data.projects[newProjectIndex].projectEmployees[draggableNumber].push(draggableName);
                }

                //updates the json file
                postUpdates(data);

            });
    };

    let projectNameInput = document.getElementById("projectName");
    const addProjectButton = document.getElementById("addProject");


    const addProject = () => {

        const projectName = projectNameInput.value;
        console.log("projectNmae " + projectName);
        if (projectName !== "") {

            const row = document.createElement("tr");
            const firstCell = document.createElement("td");
            const rowCount = table.rows.length - 2;
            console.log("rowCount " + rowCount);
            const removeRowButton = document.createElement("button");
            removeRowButton.id = "removeButton";
            removeRowButton.innerHTML = "Fjern prosjekt";
            firstCell.innerHTML = projectName;
            firstCell.appendChild(removeRowButton);
            row.appendChild(firstCell);
            table.insertBefore(row, table.children[rowCount]);

            removeRowButton.onclick = function () {
                removeProject(removeRowButton); // Send knappen selv som argument
            };

            //makes 15 new cells for each row
            for (let i = 0; i <= 14; i++) {
                const cellId = projectName;
                let cell = document.createElement("td");
                cell.id = cellId;
                cell.classList.add("dropzone");
                cell.textContent = cellId;
                initializeDropzone(cell);
                row.appendChild(cell);
            }


            fetch('http://localhost:3000/positions')
                .then(response => response.json())
                .then(data => {
                    //array
                    const newProject = {
                        projectName: projectName,
                        projectColor: "",
                        projectEmployees: []
                    }

                    data.projects.push(newProject);
                    console.log(data.projects);

                    postUpdates(data);

                })


            projectNameInput.value = "";

        }
        else {
            alert("Gi prosjektet et navn!");
        }
    }

    const removeProject = (button) => {
        const row = button.parentNode.parentNode;
        const cell = button.parentNode;
        const projectName = cell.id;

        table.removeChild(row);

        fetch('http://localhost:3000/positions')
            .then(response => response.json())
            .then(data => {
                //array
                data.projects = data.projects.filter(project => project.projectName !== projectName);


                postUpdates(data);

            })


    }





    loadGrid();

    addProjectButton.addEventListener("click", addProject);
    document.querySelectorAll(".dropzone").forEach(initializeDropzone);
});