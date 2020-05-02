import React, { useEffect } from 'react';
import logo from './logo.svg';
import './App.css';
import parseCSV from 'papaparse'
import createPlotlyComponent from 'react-plotly.js/factory';
const Plotly = window.Plotly;
const Plot = createPlotlyComponent(Plotly);

function App() {
  const [data, setData] = React.useState()

  const getCsvData = async () => {
    const fetchFile = () => fetch('..\\time_series_covid19_confirmed_global.csv').then(response => {
      let reader = response.body.getReader();
      let decoder = new TextDecoder('utf-8');

      return reader.read().then(function (result) {
        return decoder.decode(result.value);
      });
    })

    let csvData = await fetchFile()
    parseCSV.parse(csvData, {
      complete: parsedData => setData(parsedData.data)
    });
  }

  useEffect(() => {
    getCsvData()
  }, [])

  return (
    <div className="App">
      <div style={{ textAlign: "left" }}>
        {
          data && data.length > 0 && <DisplayData data={data} />
        }
      </div>
    </div>
  );
}

const DisplayData = ({ data }) => {
  const headers = data[0]
  data.shift()

  function average(data) {
    var sum = data.reduce(function (sum, value) {
      return sum + value;
    }, 0);
    var avg = sum / data.length;
    return avg;
  }

  function smooth(values, alpha) {
    var weighted = average(values) * alpha;
    var smoothed = [];
    for (var i in values) {
      var curr = values[i];
      var prev = smoothed[i - 1] || values[values.length - 1];
      var next = curr || values[0];
      var improved = Number(average([weighted, prev, curr, next]).toFixed(2));
      smoothed.push(improved);
    }
    return smoothed;
  }

  const locations = []
  const copyData = JSON.parse(JSON.stringify(data))
  copyData.forEach(regionAsArray => {
    const newLocation = {
      region: regionAsArray[0],
      country: regionAsArray[1],
      lat: regionAsArray[2],
      long: regionAsArray[3],
      numbers: smooth(regionAsArray.slice(5, regionAsArray.length).map((infectedCount, index, counts) => {
        if (index === 0) return 0
        else if (counts[index - 1] == 0) return 0
        else return ((infectedCount) / counts[index - 1])
      }), 0.9)
    }
    locations.push(newLocation)
  })
  console.log(locations)

  var days = [];
  for (var i = 0; i < 100; i++) {
    days.push(i);
  }

const formatLocationsForPlotly = locations => {
  const plotlyGraphs = []
  locations.forEach((location, index) => {
    if(location.country != "Bahrain" && location.country != "Andorra"){
    plotlyGraphs.push({
      x: days,
      y: location.numbers,
      type: 'scatter',
      mode: 'lines',
      name: location.country + (location.region ? " - " + location.region : ''),
    })
  }
  })
  return plotlyGraphs
}

  return (
    <>
    <Plot
        data={formatLocationsForPlotly(locations)}
        layout={{title: 'Coronavirus Growth by Country', width:1400}}
      />
    <table className={"raw-data"}>
      <tr>{headers.map(headerText => <th key={headerText}>{headerText}</th>)}</tr>
      {data.sort(function (a, b) {
        return b[b.length - 1] - a[a.length - 1];
      }).map(region =>
        <tr key={region[0] + region[1]}>
          {region.map((property, index) => (<td key={region[0] + region[1] + index}>{property}</td>))}
        </tr>
      )}
    </table>
    </>
  )
}

export default App;
