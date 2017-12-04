
//Game board is provided
//Game board is provided
//1s are blocks and 0s are free spaces
//Each grid cell on the board is a square with dimension 50px
var board = [[0,0,0,1,0,0],
             [0,0,0,0,0,1],
             [0,0,0,0,1,0],
             [0,0,0,0,0,0],
             [1,0,0,0,0,0],
             [0,1,0,0,0,0],
             [0,0,1,0,0,0]];

var nCols = board[0].length;
var nRows = board.length;
var nVisibleRows = 6; //given

//Dimensions in px
var cellWidth = 50;
var cellHeight = cellWidth;
var boardWidth = nCols * cellWidth;
var boardHeight = nVisibleRows * cellWidth;

var blockColor = "rgb(0, 0, 255)";
var gridCells = [];

//Ship Position
var shipRow;
var shipCol;
var crowdShipRow;
var crowdShipCol;
var crowdShipCell;

//Animation Intervals
var animateInterval;
var checkShipInterval;

var offset = null;

//Reward
var rewardPerAnimation = 0.001;
var totalReward = 0.000;
var maxReward = 2.000;

//keep track of number of key downs to help detect cheaters
var keydowns = 0;

//mediator
var mediator = "average"; //"average" or "better"


$(document).ready(function () {
    //Set up board
    var gameBoard = $("#gameBoard");
    gameBoard.width(boardWidth);
    gameBoard.height(boardHeight);
    gameBoardColor = gameBoard.css('backgroundColor');

    //Create grid cells
    for (var iRow=0; iRow<nVisibleRows; iRow++) {
        gridCells[iRow] = [];
        gridCellY = cellHeight*iRow;

        for (var iCol=0; iCol<nCols; iCol++) {
            var gridCell = $("<div>", {"class": "gridCell"});
            gridCell.width(cellWidth);
            gridCell.height(cellHeight);

            gridCellX = cellWidth*iCol;
            gridCell.css("left", gridCellX+"px");
            gridCell.css("top", gridCellY+"px");

            gameBoard.append(gridCell);
            gridCells[iRow][iCol] = gridCell;
        }
    }

    //Create Crowd ship
    crowdShipRow = nVisibleRows-1;
    crowdShipCol = Math.floor(nCols/2);
    crowdShipCell = $("<div>", {id: "crowdShipCell", "class": "gridCell"});
    crowdShipCell.width(cellWidth);
    crowdShipCell.height(cellHeight);
    
    var crowdShipX = cellWidth*crowdShipCol;
    var crowdShipY = cellHeight*crowdShipRow;

    crowdShipCell.css("left", crowdShipX+"px");
    crowdShipCell.css("top", crowdShipY+"px");

    gameBoard.append(crowdShipCell);
    crowdShipCell.html("<img src='car1v2.png'/>"); //EO.jpg


    //Create ship
    shipRow = crowdShipRow;
    shipCol = crowdShipCol;
    var shipCell = $("<div>", {id: "shipCell", "class": "gridCell"});
    shipCell.width(cellWidth);
    shipCell.height(cellHeight);
    
    var shipX = crowdShipX
    var shipY = crowdShipY

    shipCell.css("left", shipX+"px");
    shipCell.css("top", shipY+"px");
    shipCell.css({"border-color": "rgb(255,0,0)", 
                  "border-width":"4px", 
                  "border-style":"solid",
                  "box-sizing":"border-box"});

    gameBoard.append(shipCell);

    //Ship controls
    $(document).keydown(function(e) {
        if(e.keyCode==37) {
            //left arrow clicked
            shipCol = mod(--shipCol, nCols);
            shipX = cellWidth*shipCol
            shipCell.css("left", shipX+"px");

        } else if(e.keyCode == 39) {
            //right arrow clicked
            shipCol = mod(++shipCol, nCols);
            shipX = cellWidth*shipCol
            shipCell.css("left", shipX+"px");
        }
    });


    //Animation
    $('#start').click(function() {
        animateInterval = setInterval(function() {
            updateBoard();
        }, 500);
    
        //Uncomment this to enable crash detection
        //Check ship (has immunity for first 3 seconds)
        setTimeout( function(){
            checkShipInterval = setInterval(function() {
                checkShip();
            }, 50);
        }, 3000);
    });
    

    //Check max reward
    $('#reward').on('input', function() {
        if (totalReward >= maxReward) {
            clearInterval(animateInterval);
            clearInterval(checkShipInterval);
            $(document).off('keydown');
            setTimeout( function(){
                alert("GOOD JOB");
            }, 50);
        }
    });


    //Log key presses
    $(document).keydown(function(e) {
		keydowns++;
		$("#numkeydowns").val(keydowns);
	})
});



function updateBoard() {
    //var offset = Math.floor(new Date().getTime() / 1000.0);

    //JSONP
    $.ajax({
        url: "//codingthecrowd.com/counter.php",
    
        // The name of the callback parameter
        jsonp: "callback",
    
        // Tell jQuery we're expecting JSONP
        dataType: "jsonp",
    
        // Say what we want and that we want JSON
        data: {
            key: "zachtest1",
            data: shipCol,
            format: "json"
        },
    
        // Work with the response
        success: function( response ) {
            offset = response.time;
            console.log( offset );
            console.log( response ); // server response

            //update crowd ship pos (mediator)
            var allShipCols = [];
            $.each(response.results, function() {
                var indShipCol = $(this)[0].data;
                allShipCols.push(indShipCol);
            });

            var allShipCols = allShipCols.map(function (x) { 
                return parseInt(x, 10); 
            });
            
            medianShipCol = median(allShipCols);
            console.log( medianShipCol );

            crowdShipCol = Math.floor(medianShipCol);
            crowdShipX = cellWidth*crowdShipCol;
            crowdShipCell.css("left", crowdShipX+"px");
        }
    });

    for(var iRow=0; iRow<nVisibleRows; iRow++) {
        var y = mod(offset + iRow, nRows); //row number
        var ry = nVisibleRows-iRow-1; //row number

        for(var iCol=0; iCol<nCols; iCol++) {
            if(board[y][iCol] == 0) {
                gridCells[ry][iCol].html("");
            } else {
                gridCells[ry][iCol].html("<img src='car2v2.png'/>");
            }
        }
    }

    totalReward += rewardPerAnimation;
    $("#reward").attr('value', totalReward.toFixed(3)).trigger("input");
}



//Check if ship crashed
function checkShip() {
    if (gridCells[crowdShipRow][crowdShipCol].html()!="") {
        clearInterval(animateInterval);
        clearInterval(checkShipInterval);
        $(document).off('keydown');
        setTimeout( function(){
            alert("GAME OVER");
        }, 50);
    }
}


function mod(x, m) {
    return (x%m + m)%m;
}



function median(values) {
    values.sort( function(a,b) {return a - b;} );

    var half = Math.floor(values.length/2);

    if(values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
}

