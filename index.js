const   pgnParser     = require('pgn-parser'),
        fs = require('fs'),
        es = require('event-stream');

const PGN_PATH = './lichess_db_standard_rated_2013-01.pgn'; //'test.pgn';

let sequence = []; //'d4', 'd5', 'Bf4', 'h6', 'e3', 'g5', 'Bg3', 'Nf6', 'c3', 'e6', 'Nf3', 'Nc6', 'h4', 'Ne4', 'Bd3'

let gameCount = 0;
let lineNumber = 0;
let pgn = '';
let gameWithErrorsCount = 0;
let londonGames = [];
let foundGames = [];

let isLondonSystem = (moves) => {
    let openingMoves = moves.slice(0, 20);
    let condition = 0;
    for (let i = 0; i < openingMoves.length; i += 2) {
        if (openingMoves[i].hasOwnProperty('move_number') &&
            (openingMoves[i].move === 'd4' ||
            openingMoves[i].move === 'Bf4' ||
            openingMoves[i].move === 'e3')
        ) {
                condition++;
        }
    }
    return (condition >= 3);
};

let findSequence = (moves) => {
    for (let i = 0; i < sequence.length && i < moves.length; i++) {
        if (sequence[i] !== moves[i].move)
            return false;
    }
    return (sequence.length && sequence.length <= moves.length);
};

let startProgram = (err, parser) => {
    fs.createReadStream(PGN_PATH)
        .pipe(es.split())
        .pipe(
            es
            .mapSync(function(line) {
                lineNumber++;
                pgn += line;

                if (line.length > 0 && line[0] !== '[') {
                    gameCount++;
                    try {
                        const [result] = parser.parse(pgn);
                        process.stdout.write('\r ' + gameCount + '. Url: ' + result.headers.Site + ' in ' + result.moves.length + ' moves');
                        if (isLondonSystem(result.moves)) {
                            londonGames.push(gameCount);
                        }
                        if (findSequence(result.moves)) {
                            foundGames.push(result.headers.Site);
                        }
                    } catch(parserError) {
                        gameWithErrorsCount++;
                        console.log('\n\n\n', gameCount, lineNumber);
                    }
                    pgn = '';
                }
            })
            .on('error', function(err) {
                console.log('\nError while reading file.', err);
            })
            .on('end', function() {
                console.log('\nLondon games found:' + londonGames.length);
                console.log('\nRead entire file.\nFound ' + gameWithErrorsCount + ' games with errors out of ' + gameCount + ' games.');
                console.log('Games by sequence found:');
                // console.log(londonGames);
                // console.log(foundGames);
            }),
        );
};

pgnParser(startProgram);
