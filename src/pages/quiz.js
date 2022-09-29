new Sortable(quiz);

const correctAnswers = [
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
];

const correctAnswers2 = [
    "7",
    "8",
    "9",
    "10",
];

let score = 0;
let questionNumber = 1;

const arrayOArrayCorrectAnswers = [correctAnswers, correctAnswers2]


function checkAnswer() {
    var elem = document.getElementById("quiz");
    let answers = new Array();
    if (questionNumber == 1) {
        const li = document.querySelectorAll("#quiz li");

        li.forEach(function (text) {
            answers.push(text.innerHTML);
        });
        if (JSON.stringify(correctAnswers) === JSON.stringify(answers)) {
            //alert("first questions correct");
            score++;

        } else {
            //alert("first questions wrong");
        }

        // clearing the elments in the unordered list
        while (elem.lastElementChild) {
            elem.removeChild(elem.lastElementChild);
        }

        var option1 = document.createElement('li');
        option1.innerHTML = "7"
        elem.appendChild(option1)

        var option2 = document.createElement('li');
        option2.innerHTML = "8"
        elem.appendChild(option2)

        var option3 = document.createElement('li');
        option3.innerHTML = "9"
        elem.appendChild(option3)

        var option4 = document.createElement('li');
        option4.innerHTML = "10"
        elem.appendChild(option4)

        console.log("pushed new children")
        answers.length = 0
        console.log("emptied the answers")

        questionNumber++;
        console.log("incremented question number");
        document.getElementById("hint").setAttribute("src", "imagesForQuiz/memory23.PNG");
        document.getElementById("difficulty-select").style.display = 'none';

    } else {
        console.log("answered second question");
        // adding the new elements
        for (var i = 0; i < elem.children.length; i++) {
            var option = elem.children[i];
            answers.push(option.innerHTML);

        }

        if (JSON.stringify(correctAnswers2) === JSON.stringify(answers)) {
            //alert("second question correct");
            score++;
        } else {
            //alert("second question correct");
        }
    }

    document.getElementById("score").innerHTML = score;

}

function removeHints(index) {
    if (index != 1) {
        console.log("gonna remove images");
        document.getElementById("hint").style.display = 'none';
    }
    else {
        document.getElementById("hint").style.display = 'block';
    }

}
