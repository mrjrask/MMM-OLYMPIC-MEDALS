const assert = require('assert');
const Module = require('module');

const originalLoad = Module._load;
Module._load = function patchedLoader(request, parent, isMain) {
    if (request === 'logger') {
        return {
            warn: () => {},
            info: () => {},
            error: () => {},
            debug: () => {},
        };
    }

    return originalLoad(request, parent, isMain);
};

const { parseMedalData } = require('../espn');

function run() {
    const htmlWithEmbeddedAbbrev = `
        <table>
            <caption>Medals</caption>
            <thead>
                <tr><th>Team</th><th>Gold</th><th>Silver</th><th>Bronze</th><th>Total</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td><span class="country_name--long">United States</span><span>USA</span></td>
                    <td>10</td><td>5</td><td>2</td><td>17</td>
                </tr>
            </tbody>
        </table>
    `;

    const embeddedResult = parseMedalData(htmlWithEmbeddedAbbrev, 5);
    assert.equal(embeddedResult.rows[0].abbreviation, 'USA');

    const htmlWithDirectAbbrev = `
        <table>
            <caption>Medals</caption>
            <thead>
                <tr><th>Country</th><th>Gold</th><th>Silver</th><th>Bronze</th><th>Total</th></tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <span class="country_name--long">Canada</span>
                        <span class="country_name--abbrev">can</span>
                    </td>
                    <td>1</td><td>2</td><td>3</td><td>6</td>
                </tr>
            </tbody>
        </table>
    `;

    const directResult = parseMedalData(htmlWithDirectAbbrev, 5);
    assert.equal(directResult.rows[0].abbreviation, 'CAN');

    console.log('parseMedalData abbreviation tests passed');
}

run();
