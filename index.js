const fs = require('fs')
const gcd = require('@stdlib/math-base-special-gcd');
const munkres = require('munkres-js');
const inquirer = require('inquirer'); 
const chalk = require('chalk');

/**
 * Receives a path and open the file to get the info
 * @param {string} path
 * 
 */
const openFile = (path) => {
    return fs.readFileSync(path, 'utf8')
}

/**
 * Generates an array filled with zero's
 * @param {number} rowAndCols
 * 
 * @retuns {Array}
 */
const generateArray = (rowAndCols) => {
    return new Array(rowAndCols).fill(0).map(() => {
        return new Array(rowAndCols).fill(0);
    });
}

/**
 * This calculate the SS (Suitability Score)
 * @param {string} driverName - Name of the driver
 * @param {string} dest - Name of the destination
 * 
 * @returns {float} The score of the user
 */
const calculateSS = (driverName, dest) => {
    let score = dest.length % 2 == 0 
        ? getVowelsQuantity(driverName) * 1.5
        : getConsonantsQuantity(driverName);

    if (hasCommonFactors(driverName, dest)) {
        score = score * 1.5;
    }

    return score;
}

const getVowelsQuantity = word => (word.match(/[aeiou]/gi) || []).length
const getConsonantsQuantity = word => (word.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length

/**
 * Check if the two words shares any common factors
 * @param {string} word1 - Name of the driver
 * @param {string} word2 - Name of the destination
 * 
 * @returns {bool}
 */
const hasCommonFactors = (word1, word2) => {
    const newWord1 = [...word1].filter(w => w !== " ")
    const newWord2 = [...word2].filter(w => w !== " ")

    return gcd(newWord1.length, newWord2.length) > 1 ? true : false;
}

/**
 * Take the array of indexs and converted to and array of [[ driverName, addressName ]]
 * 
 * @param {Array} arr - Array [[ driverIndex, addressIndex ]]
 * @param {string} arrDrivers - Plain array of all the drivers names
 * @param {string} arrDestinations - Plain array of all the destinations
 * 
 * @returns {Array}
 */
const getNameAndAddressMatches = (arr, arrDrivers, arrDestinations) => {
    return arr.map(val => {
        return [ arrDrivers[val[0]], arrDestinations[val[1]] ]
    })
}

/**
 * Check the array and sum the SS point.
 * @param {Array} arrayOfIndexs - Array with the solution [[ driverIndex, addressIndex ]]
 * @param {string} matrixSS - Matrix of SS
 * 
 * @returns {float}
 */
const getBaseSuitabilityScore = (arrayOfIndexs, matrixSS) => {
    let total = 0;
    arrayOfIndexs.forEach((index) => {
        total += matrixSS[index[0]][index[1]]
    })
    return total;
}

/**
 * Print nicely on console
 * @param {float} score - The final score
 * @param {Array} namesAndAddresses - Matrix of SS
 * 
 * @returns {float}
 */
const nicePrintOnConsole = (score, namesAndAddresses) => {
    console.clear()
    console.log(chalk.green(`The Suitability Score is ${score}`));
    console.log(chalk.green("\n Assignments:"))

    const toDisplayNice = []
    namesAndAddresses.forEach(val => {
        toDisplayNice.push({
            driver: val[0],
            destination: val[1],
        })
    })

    console.table(toDisplayNice)
}

/**
 * Just to be nice :)
 * 
 * @returns {void}
 */
const greetingCommandLine = () => {
    console.log(chalk.green("Hey, thank you for check this :)"))
    console.log(chalk.green("Please select the files, please use .txt, I don't want to break."))
    console.log(chalk.green("Remember, every record has to be on different lines."))
    console.log("")
}

/**
 * Manage the command line to get the inputs.
 * 
 * @returns {Object} { destinationFile, driversFile }
 */
const manageCommandLine = async () => {
    const validateInput = path => {
        if (fs.existsSync(path)) {
            return true;
        }
        return "That path is not valid, sorry :(. Try again please."
    }

    return inquirer
        .prompt([
            {
                name: 'destinationFile',
                message: 'Please select the path for the DESTINATION FILE. Remember that you can drag and drop the file too: \n ->',
                validate: validateInput
            },
            {
                name: 'driversFile',
                message: 'Please select the path for the DRIVER FILE. Remember that you can drag and drop the file too: \n ->',
                validate: validateInput
            },
        ])
        .then((answers) => {
            return {
                destinationFile: openFile(answers.destinationFile),
                driversFile: openFile(answers.driversFile)
            }
        })
        .catch((error) => {
            if (error.isTtyError) {
                console.error(chalk.red("Error trying to open the program :("))
            } else {
                console.error(chalk.red("Error: ", error.message))
            }
        });
}

/**
 * MAIN FUNCTION
 */
async function main() {
    greetingCommandLine()

    // Until everything is okay, this going to continue.
    let valid = false;
    while (!valid) {
        var { destinationFile, driversFile } = await manageCommandLine()
        var arrOfDrivers = driversFile.split("\r\n")
        var arrOfDestinations = destinationFile.split("\r\n")

        // Validations
        if (!Array.isArray(arrOfDrivers) || !Array.isArray(arrOfDestinations)) {
            console.log(chalk.red("Error: Cannot generate an array from one of the files. Please send it again. \n"))
            continue;
        }
        if (arrOfDrivers.length !== arrOfDestinations.length) {
            console.log(chalk.red("Error: Both lists must be of the same size. Please send it again. \n"))
            continue;
        }
        valid = true;
    }
    
    const originalMatrixSS = generateArray(arrOfDrivers.length) // This is the original when we gonna save the SS
    const matrixSSModified = generateArray(arrOfDrivers.length) // Here we gonna save (2000 - value) so we can use the Munkres algorithm
    
    arrOfDrivers.forEach((driverName, i) => {
        arrOfDestinations.forEach((desti, j) => {
            let SSvalue = calculateSS(driverName, desti);
            originalMatrixSS[i][j] = SSvalue
            matrixSSModified[i][j] = 2000 - SSvalue
        })
    })

    const indexsOfTheSolution = munkres(matrixSSModified);
    const namesAndAddresses = getNameAndAddressMatches(indexsOfTheSolution, arrOfDrivers, arrOfDestinations)
    const BaseSuitabilityScore = getBaseSuitabilityScore(indexsOfTheSolution, originalMatrixSS)

    nicePrintOnConsole(BaseSuitabilityScore, namesAndAddresses)
}

main()