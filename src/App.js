import React, { useEffect } from 'react';
import { useWindowSize } from 'react-use'
import './App.css';
import parseCSV from 'papaparse'
//import regression from 'regression'
import populations from './populations.json'
import createPlotlyComponent from 'react-plotly.js/factory';
import 'react-accessible-accordion/dist/fancy-example.css';
import {
  Accordion,
  AccordionItem,
  AccordionItemHeading,
  AccordionItemButton,
  AccordionItemPanel,
} from 'react-accessible-accordion';
// https://ghrp.biomedcentral.com/articles/10.1186/s41256-020-00137-4

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
      <h1>Coronavirus Modeled as a Chaotic System</h1>
      <Accordion allowZeroExpanded={true}>
        <AccordionItem>
          <AccordionItemHeading>
            <AccordionItemButton>
              What's a "chaotic system?"
                    </AccordionItemButton>
          </AccordionItemHeading>
          <AccordionItemPanel>
            <GridMe
              content={
                <div>
                  <span>First defined by the French mathematician Poincaré in the 1880s, a physical or mathematical system is chaotic if <q>small differences in the initial conditions produce very great ones in the final</q> product, meaning that{" "}
                  <q>measurements made on the state of a system at a given time may not allow us to predict the future situation. <a href="#sources">(1, 2)</a></q></span>
                  <br/>
                  <br/>
                  <span>In other words, chaos happens in a system when all of the following are true:</span>
                  <ul>
                    <li><b>Deterministic:</b> the behavior of the system (for example, temperature change over time) is determined by initial conditions (for example, starting temperature, day of the year, etc).</li>
                    <li><b>Sensitive:</b> the behavior of the system can be changed <em>dramatically</em> by a <em>small</em> change in the initial conditions.</li>
                    <li><b>Numerically unpredictable:</b> the future behavior of the system is not predictable based on the state at any time. <br/> We can't solve chaotic systems to find exact answers like "how many people will get this disease?" or "what date will have X number of cases?"</li>
                  </ul>
                </div>
              }
              graph={
                <figure>
                  <img src="/chaos-img2.gif" alt="Simplified Chaos Example" style={{width: "100%"}} />
                  <figcaption>A very simplified example of a chaotic system <a href="#sources">(3)</a></figcaption>
                </figure>
              }
            />
            <GridMe
              content={
                <div>
                  
                </div>
              }
              graph={
                <figure>
                  <img src="/chaos-img6.gif" alt="Simplified Chaos Example" style={{width: "100%"}} />
                  <figcaption>A very simplified example of a chaotic system <a href="#sources">(3)</a></figcaption>
                </figure>
              }
            />
          </AccordionItemPanel>
        </AccordionItem>
      </Accordion>
      <div style={{ textAlign: "left" }}>
        {
          data && data.length > 0 && <DisplayData data={data} />
        }
      </div>
    </div>
  );
}

const DisplayData = ({ data }) => {
  const { width } = useWindowSize()
  const headers = data[0]
  console.log(headers)

  const pointDerivative = (index, numbers) => {
    if (index === 0) return (numbers[1] - numbers[0])
    else if (index === numbers.length - 1) return (numbers[numbers.length - 1] - numbers[numbers.length - 2])
    else return (numbers[index + 1] - numbers[index])
  }

  const locations = []
  const copyData = JSON.parse(JSON.stringify(data))
  copyData.shift()
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
    newLocation.valuesPerCapita = newLocation.values.map(cases => cases / populations[newLocation.country])
    newLocation.derivativesPerCapita = newLocation.valuesPerCapita.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    newLocation.doubleDerivativesPerCapita = newLocation.derivativesPerCapita.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    if (newLocation.country === "US") console.log(newLocation.valuesPerCapita)
    locations.push(newLocation)
  })

  var days = [];
  for (var i = 0; i < locations[0].values.length - 2; i++) {
    days.push(i + " - " + headers[4 + i]);
  }

  const formatString = str => {
    return str ? str.match(/.{1,16}/g).join("-<br>") : str
  }

  const formatLocationsForPlotly = ({ locations, filter, property }) => {
    const plotlyGraphs = []
    locations.forEach((location, index) => {
      if (!filter || location.country === filter || (Array.isArray(filter) && filter.includes(location.country))) {
        if (!["Holy See", "MS Zaandam", "Luxembourg", "Diamond Princess", "San Marino"].includes(location.country))
          plotlyGraphs.push({
            x: days,
            y: location[property],
            type: 'scatter',
            mode: 'lines',
            name: location.region ? formatString(location.country) + ",<br>" + formatString(location.region) : formatString(location.country),
          })
      }
    })
    return plotlyGraphs
  }

  const RawDataTable = React.useCallback(({ headers, data }) => (
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
  ), [headers, data])

  return (
    <>
      <GridMe
        content={<h2>Raw Data</h2>}
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "valuesPerCapita" })}
            layout={{ title: 'Daily Coronavirus Cases, by Country', width: 3 / 5 * width }}
          />
        }
      />

      <GridMe
        content={<h2>Test Header 2</h2>}
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "derivatives" })}
            layout={{ title: 'Derivative of Daily Coronavirus Cases, by Country', width: 3 / 5 * width }}
          />
        }
      />

      <GridMe
        content={<h2>Test Header 2</h2>}
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "doubleDerivatives" })}
            layout={{ title: 'Second-derivative of Daily Coronavirus Cases, by Country', width: 3 / 5 * width }}
          />
        }
      />
      <GridMe
        content={<h2>TEST HEADER</h2>}
        graph={
          <Plot
            data={formatLocationsForPlotly({
              locations: locations.filter(function (obj) {
                return !obj.region;
              }), property: "doubleDerivativesPerCapita"
            })}
            layout={{ title: 'Second-derivative of Daily Coronavirus Cases per Capita, by Country', width: 3 / 5 * width }}
          />
        }
        className={"secDerPerCap"}
      />
      {/* <RawDataTable data={data} headers={headers}/> */}
      <Sources/>
    </>
  )
}

const GridMe = ({ content, graph, className }) => (
  <div className={className}>
    <div style={{ textAlign: "left", width: "35%", display: "inline-block", verticalAlign: "top", padding: 20 }}>
      {content}
    </div>
    <div style={{ textAlign: "right", display: "inline-block" }}>
      {graph}
    </div>
  </div>
)

const Sources = () => {
  return (
    <ol id="sources">
      <li>H. Poincaré, Acta Math. 13, 1 (1890).</li>
      <li><a href="www.scielo.br/scielo.php?script=sci_arttext&pid=S1806-11172017000100409&lng=en&tlng=en">Cattani, et al. “Deterministic Chaos Theory: Basic Concepts.” Revista Brasileira De Ensino De Física, Sociedade Brasileira De Física, 17 Oct. 2016, www.scielo.br/scielo.php?script=sci_arttext&pid=S1806-11172017000100409&lng=en&tlng=en</a></li>
      <li><a href="https://www.physicscentral.com/explore/action/chaos.cfm">https://www.physicscentral.com/explore/action/chaos.cfm</a></li>
    </ol>
  )
}

export default App;
