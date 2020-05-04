import React, { useEffect } from 'react';
import './App.css';
import parseCSV from 'papaparse'
//import regression from 'regression'
import createPlotlyComponent from 'react-plotly.js/factory';
const Plotly = window.Plotly;
const Plot = createPlotlyComponent(Plotly);
// https://ghrp.biomedcentral.com/articles/10.1186/s41256-020-00137-4

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
  const inputRef = React.useRef()
  const [filter, setFilter] = React.useState()

  const changeFilters = () => {
    const newFilters = inputRef.current.value.split(",")
    if (newFilters && newFilters.length > 0){
      setFilter(newFilters)
    } else {
      setFilter(null)
    }
  }

  const headers = data[0]
  data.shift()


  const pointDerivative = (index, numbers) => {
    if (index === 0) return (numbers[1] - numbers[0])
    else if (index === numbers.length - 1) return (numbers[numbers.length - 1] - numbers[numbers.length - 2])
    else return (numbers[index + 1] - numbers[index])
  }

  const locations = []
  const copyData = JSON.parse(JSON.stringify(data))
  copyData.forEach(regionAsArray => {
    const newLocation = {
      region: regionAsArray[0],
      country: regionAsArray[1],
      lat: regionAsArray[2],
      long: regionAsArray[3],
      dayToDayProportion: regionAsArray.slice(5, regionAsArray.length).map((infectedCount, index, counts) => {
        if (index === 0) return 0
        else if (counts[index - 1] == 0) return 0
        else return ((infectedCount) / counts[index - 1])
      }),
      values: regionAsArray.slice(4, regionAsArray.length)
    }
    newLocation.derivatives = newLocation.values.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    newLocation.doubleDerivatives = newLocation.derivatives.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    // Log the US data to console for debugging
    if (newLocation.country === "US") {
      console.log({ country: newLocation.country, region: newLocation.region, dailyDerivative: newLocation.derivatives, doubleDerivatives: newLocation.doubleDerivatives })
    }
    locations.push(newLocation)
  })

  var days = [];
  for (var i = 0; i < 100; i++) {
    days.push(i);
  }

  const formatLocationsForPlotly = ({ locations, filter, property }) => {
    const plotlyGraphs = []
    locations.forEach((location, index) => {
      if (!filter || location.country === filter || (Array.isArray(filter) && filter.includes(location.country))) {
        //if(location.country !== "France" && location.country !== "Andorra")
        plotlyGraphs.push({
          x: days,
          y: location[property],
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
        data={formatLocationsForPlotly({ locations, property: "doubleDerivatives"})}
        layout={{ title: 'Second-derivative of Daily Coronavirus Cases, by Country', width: 1400 }}
      />
      <br/>
      <label htmlFor="filters">Comma-separated List Of Filters:<br/><input type="text" ref={inputRef}/></label><button onClick={changeFilters}>Apply Filters</button>
      <table className={"raw-data"}>
        <thead><tr>{headers.map(headerText => <th key={headerText}>{headerText}</th>)}</tr></thead>
        <tbody>
          {data.sort(function (a, b) {
            return b[b.length - 1] - a[a.length - 1];
          }).map(region =>
            <tr key={region[0] + region[1]}>
              {region.map((property, index) => (<td key={region[0] + region[1] + index}>{property}</td>))}
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}

export default App;
