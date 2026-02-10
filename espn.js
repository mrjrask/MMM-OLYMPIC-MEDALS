const cheerio = require('cheerio');
const LOG = require('logger');

const IOC_ABBREVIATIONS = {
    'ain': 'AIN',
    'argentina': 'ARG',
    'armenia': 'ARM',
    'australia': 'AUS',
    'austria': 'AUT',
    'azerbaijan': 'AZE',
    'bahamas': 'BAH',
    'bahrain': 'BRN',
    'belgium': 'BEL',
    'bermuda': 'BER',
    'brazil': 'BRA',
    'bulgaria': 'BUL',
    'canada': 'CAN',
    'cape verde': 'CPV',
    'cabo verde': 'CPV',
    'chile': 'CHI',
    'chinese taipei': 'TPE',
    'taiwan': 'TPE',
    'colombia': 'COL',
    'croatia': 'CRO',
    'cuba': 'CUB',
    'cyprus': 'CYP',
    'czech republic': 'CZE',
    'czechia': 'CZE',
    'denmark': 'DEN',
    'dominica': 'DMA',
    'dominican republic': 'DOM',
    'ecuador': 'ECU',
    'egypt': 'EGY',
    'ethiopia': 'ETH',
    'fiji': 'FIJ',
    'finland': 'FIN',
    'france': 'FRA',
    'georgia': 'GEO',
    'germany': 'GER',
    'great britain': 'GBR',
    'united kingdom': 'GBR',
    'greece': 'GRE',
    'grenada': 'GRN',
    'hungary': 'HUN',
    'india': 'IND',
    'indonesia': 'INA',
    'iran': 'IRI',
    'islamic republic of iran': 'IRI',
    'ireland': 'IRL',
    'israel': 'ISR',
    'italy': 'ITA',
    'jamaica': 'JAM',
    'japan': 'JPN',
    'jordan': 'JOR',
    'kazakhstan': 'KAZ',
    'kenya': 'KEN',
    'kosovo': 'KOS',
    'kyrgyzstan': 'KGZ',
    'latvia': 'LAT',
    'lithuania': 'LTU',
    'malaysia': 'MAS',
    'mexico': 'MEX',
    'moldova': 'MDA',
    'mongolia': 'MGL',
    'morocco': 'MAR',
    'netherlands': 'NED',
    'new zealand': 'NZL',
    'north korea': 'PRK',
    'democratic peoples republic of korea': 'PRK',
    'norway': 'NOR',
    'pakistan': 'PAK',
    'philippines': 'PHI',
    'poland': 'POL',
    'portugal': 'POR',
    'qatar': 'QAT',
    'refugee olympic team': 'EOR',
    'romania': 'ROU',
    'russia': 'RUS',
    'san marino': 'SMR',
    'serbia': 'SRB',
    'singapore': 'SGP',
    'slovakia': 'SVK',
    'slovenia': 'SLO',
    'south africa': 'RSA',
    'south korea': 'KOR',
    'republic of korea': 'KOR',
    'spain': 'ESP',
    'sweden': 'SWE',
    'switzerland': 'SUI',
    'tajikistan': 'TJK',
    'thailand': 'THA',
    'trinidad and tobago': 'TTO',
    'tunisia': 'TUN',
    'turkey': 'TUR',
    'turkiye': 'TUR',
    'uganda': 'UGA',
    'ukraine': 'UKR',
    'united states': 'USA',
    'uruguay': 'URU',
    'uzbekistan': 'UZB',
    'venezuela': 'VEN'
};

function getURL(type, year) {
    if (type === 'winter') {
        return 'https://www.espn.com/olympics/winter/2026/medals';
    }
    return `https://www.espn.com/olympics/${type}/${year}/medals`;
}

function getAlternateURL(type, year) {
    return `https://www.espn.com/olympics/${type}/${year}/medals`;
}

async function fetchPage(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed request (${response.status}) for ${url}`);
    }
    return response.text();
}

async function getMedalData(type, year, limit) {
    var url = getURL(type, year);
    var body;

    try {
        body = await fetchPage(url);
    } catch (error) {
        const alternateUrl = getAlternateURL(type, year);
        LOG.warn(`Primary ESPN URL failed, trying alternate URL: ${alternateUrl}`);
        body = await fetchPage(alternateUrl);
    }

    return parseMedalData(body, limit);
}

function parseMedalData(body, limit) {
    const $ = cheerio.load(body);
    const medalTable = findMedalTable($);

    if (!medalTable.length) {
        return {
            header: 'No Medals Data',
            rows: 'No Medals data available yet'
        };
    }

    const header = medalTable.find('caption').first().text().trim() || 'Olympic Medals';
    const columns = getColumnIndexes($, medalTable);
    let countries = [];

    medalTable.find('tbody tr').each((index, row) => {
        if (index >= limit) {
            return false;
        }

        const cells = $(row).find('th, td');
        const countryCell = getCell(cells, columns.country);
        const country =
            $(row).find('.country_name--long').first().text().trim() ||
            countryCell.find('.hide-mobile, .long-name').first().text().trim() ||
            countryCell.text().trim();
        const abbreviation = getAbbreviation($, row, countryCell, country);

        if (!country) {
            return;
        }

        countries.push({
            abbreviation,
            country,
            img: $(row).find('.team-logo, img').first().attr('src'),
            gold: getCellText(cells, columns.gold),
            silver: getCellText(cells, columns.silver),
            bronze: getCellText(cells, columns.bronze),
            total: getCellText(cells, columns.total),
        });
    });

    if (!countries.length) {
        return {
            header: 'No Medals Data',
            rows: 'No Medals data available yet'
        };
    }

    return {
        header,
        rows: countries
    };
}

function getAbbreviation($, row, countryCell, country) {
    const rowElement = $(row);
    const cellText = normalizeCountryCellText(countryCell.text());
    const mappedAbbreviation = mapCountryToIOC(country || cellText);

    if (mappedAbbreviation) {
        return mappedAbbreviation;
    }

    const directAbbreviation =
        rowElement.find('.country_name--abbrev').first().text().trim() ||
        countryCell.find('.short-name, .abbr').first().text().trim();

    if (directAbbreviation) {
        return directAbbreviation.toUpperCase();
    }

    const embeddedToken = extractThreeLetterToken(cellText);
    if (embeddedToken) {
        return embeddedToken;
    }

    return cellText.slice(0, 3).toUpperCase();
}

function mapCountryToIOC(country) {
    const normalizedCountry = normalizeCountryKey(country);
    if (!normalizedCountry) {
        return '';
    }

    return IOC_ABBREVIATIONS[normalizedCountry] || '';
}

function normalizeCountryKey(country) {
    return country
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}


function normalizeCountryCellText(text) {
    return text
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();
}

function extractThreeLetterToken(text) {
    const tokens = text.match(/\b[A-Za-z]{3}\b/g);
    if (!tokens || !tokens.length) {
        return '';
    }

    return tokens[tokens.length - 1].toUpperCase();
}

function findMedalTable($) {
    const legacyTable = $('.medal-container').next('table');
    if (legacyTable.length) {
        return legacyTable;
    }

    return $('table').filter((index, table) => {
        const headingText = $(table)
            .find('thead th')
            .map((i, th) => $(th).text().trim().toLowerCase())
            .get();

        return (
            headingText.some((text) => text.includes('gold')) &&
            headingText.some((text) => text.includes('silver')) &&
            headingText.some((text) => text.includes('bronze')) &&
            headingText.some((text) => text.includes('total'))
        );
    }).first();
}

function getColumnIndexes($, table) {
    const headers = table.find('thead th').map((index, th) => {
        return $(th).text().trim().toLowerCase();
    }).get();

    const findIndex = (terms, fallback) => {
        const index = headers.findIndex((header) => terms.some((term) => header.includes(term)));
        return index === -1 ? fallback : index;
    };

    const total = findIndex(['total', 'tot'], headers.length - 1);
    const bronze = findIndex(['bronze', 'b'], total - 1);
    const silver = findIndex(['silver', 's'], bronze - 1);

    // ESPN occasionally leaves the gold header blank, so infer it from the
    // silver column when no reliable header match is found.
    const explicitGoldIndex = headers.findIndex((header) => header.includes('gold'));
    const gold = explicitGoldIndex === -1 ? silver - 1 : explicitGoldIndex;

    return {
        country: findIndex(['country', 'team', 'noc'], Math.max(0, gold - 1)),
        gold,
        silver,
        bronze,
        total
    };
}

function getCell(cells, index) {
    if (index >= 0 && index < cells.length) {
        return cells.eq(index);
    }

    return cells.first();
}

function getCellText(cells, index) {
    return getCell(cells, index).text().trim();
}

module.exports = { getMedalData, parseMedalData };
