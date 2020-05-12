const fs = require('fs')
const fetch = require('node-fetch')
const parseCSV = require('papaparse')

const url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv'

const getCsvData = async () => {
    const fetchFile = () => fetch(url).then(response => {
        let reader = response.body.getReader();
        let decoder = new TextDecoder('utf-8');

        return reader.read().then(function (result) {
            return decoder.decode(result.value);
        });
    })

    let data;
    let csvData = await fetchFile()
    parseCSV.parse(csvData, {
        complete: parsedData => data = parsedData.data
    });

    return data
}

const storeData = (data, path) => {
    try {
        fs.writeFileSync(path, JSON.stringify(data))
    } catch (err) {
        console.error(err)
    }
}

void async function () {
    // const data = await getCsvData()
    // storeData(data, '../public/test.json')
    let data;
    fetch(url)
        .then(response => response.body)
        .then(res => res.on('readable', () => {
            let chunk;
            while (null !== (chunk = res.read())) {
                console.log("here")
                parseCSV.parse(chunk.toString(), {
                    complete: parsedData => data = data ? [...data, ...parsedData.data] : parsedData.data
                });
            }
            storeData(data, '../public/test.json')
        }))
}()