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
  console.log(data)

    // script to process the data from the csv
  //   const getCsvData = async () => {
  //   const fetchFile = () => fetch('..\\time_series_covid19_confirmed_global.csv').then(response => {
  //     let reader = response.body.getReader();
  //     let decoder = new TextDecoder('utf-8');

  //     return reader.read().then(function (result) {
  //       return decoder.decode(result.value);
  //     });
  //   })

  //   let csvData = await fetchFile()
  //   parseCSV.parse(csvData, {
  //     complete: parsedData => setData(parsedData.data)
  //   });
  // }

  // useEffect(() => {
  //   getCsvData()
  // }, [])

  //    useEffect(() => {
  //      console.log({data})
  //    }, [data])

  useEffect(() => {
    fetch("..\\formattedData.json").then(res => res.json()).then(rawData => {

      const locationsWithRegionsRemoved = {}

      rawData.forEach((location, idx) => {
        if(idx !== 0){
          // below: means a region exists on this entry
          if(location[0]){
            if(!locationsWithRegionsRemoved[location[1]]){ // algorithm has not yet found a region with this country
              location[0] = ""
              locationsWithRegionsRemoved[location[1]] = location
            }
            else {
              const summedLocation = locationsWithRegionsRemoved[location[1]]
              for(let i = 4; i < location.length; i++){
                summedLocation[i] = parseInt(summedLocation[i]) + parseInt(location[i]) + ""
              }
            }
          }
          else {
            locationsWithRegionsRemoved[location[1]] = location
          }
        }
      })

      console.log({summed: Object.values(locationsWithRegionsRemoved)})

      setData([rawData[0], ...Object.values(locationsWithRegionsRemoved)])
    })
  }, [])

  return (
    <div style={{ textAlign: "center" }}>
      <h1>COVID-19 Modeled as a Chaotic System</h1>
    {
          data && data.length > 0 && <DisplayData data={data} />
        }
      </div>
  )

  /*return (
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
                  <br />
                  <br />
                  <span>In other words, chaos happens in a system when all of the following are true:</span>
                  <ul>
                    <li><b>Deterministic:</b> the behavior of the system (for example, temperature change over time) is determined by initial conditions (for example, starting temperature, day of the year, etc).</li>
                    <li><b>Sensitive:</b> the behavior of the system can be changed <em>dramatically</em> by a <em>small</em> change in the system. For example, by doubling spread rate you might expect double the cases, but might actually see a decrease in cases by a factor of 6.</li>
                    <li><b>Numerically unpredictable:</b> the future behavior of the system is not quantitatively predictable.<br /> We might be able to find trends, but we can't solve chaotic systems to find exact answers like "how many people will get this disease?" or "what date will have X number of cases?"</li>
                  </ul>
                </div>
              }
              graph={
                <figure>
                  <img src="/chaos-img2.gif" alt="Simplified Chaos Example" style={{ width: "100%" }} />
                  <figcaption style={{ textAlign: "center" }}>A very simplified example of a disease as a chaotic system,<br /> in which the system starts at roughly the same conditions but<br /> can behave in different ways.<a href="#sources">(based on 3)</a></figcaption>
                </figure>
              }
            />
            <GridMe
              content={
                <div>
                  <span>Chaotic systems are often displayed through a bifurcation diagram, which shows how a mathematical model "evolves" or, <br />
                    becomes chaotic due to the change of a system parameter.</span>
                  <br />
                  <br />
                  <span>If we were tracking population of a bacteria, for examples, the parameter might be basic reproduction rate. In an epidemic study, the parameter might be overall spread rate.</span>
                  <br />
                  <br />
                  <span>The number of possible equilibriums for the system changes<br />based on this parameter: in the example shown, as the spread rate increases, the number of possible solutions to the system grows to chaos.</span>
                </div>
              }
              graph={
                <figure>
                  <img src="/chaos-img6.gif" alt="Simplified Chaos Example" style={{ width: "100%" }} />
                  <figcaption>An example of a bifurcation diagram<a href="#sources">(based on 3)</a></figcaption>
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
  );*/
}

const DisplayData = ({ data }) => {
  const { width } = useWindowSize()
  const headers = data[0]

  const [showAnalysis, setShowAnalysis] = React.useState(false)

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
      long: regionAsArray[3]
    }

    // Calculate values, values per capita, and shifted values per capita
    newLocation.values = regionAsArray.slice(4, regionAsArray.length)
    newLocation.valuesPerCapita = newLocation.values.map(cases => 100 * cases / populations[newLocation.country])
    newLocation.valuesPerCapitaShifted = newLocation.valuesPerCapita.filter(el => el !== 0)

    // Calculate derivatives, derivatives per capita, and shifted derivatives per capita
    newLocation.derivatives = newLocation.values.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    newLocation.derivativesPerCapita = newLocation.valuesPerCapita.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    newLocation.derivativesPerCapitaShifted = newLocation.derivativesPerCapita.filter(el => el !== 0)

    // Calculate double derivatives, double derivatives per capita, and shifted double derivatives per capita
    newLocation.doubleDerivatives = newLocation.derivatives.map((_, index, counts) => {
      return pointDerivative(index, counts)
    }).filter(el => el !== 0)
    newLocation.doubleDerivativesPerCapita = newLocation.derivativesPerCapita.map((_, index, counts) => {
      return pointDerivative(index, counts)
    })
    newLocation.doubleDerivativesPerCapitaShifted = newLocation.doubleDerivativesPerCapita.filter(el => el !== 0)

    if(!newLocation.region) locations.push(newLocation)
  })

  var days = [];
  for (var i = 0; i < locations[0].values.length - 2; i++) {
    days.push(i)// + " - " + headers[4 + i]);
  }

  var daysWithDates = []
  for (var i = 0; i < locations[0].values.length - 2; i++) {
    // reverses a date string, removes the year, reverses it back
    daysWithDates.push(i + " - " + headers[4 + i].split("").reverse().join("").replace(/([^\/]*\/){1}/, '').split("").reverse().join(""));
  }

  const formatString = str => {
    return str ? str.match(/.{1,16}/g).join("-<br>") : str
  }

  const formatLocationsForPlotly = ({ locations, filter, property }) => {
    const plotlyGraphs = []
    locations.forEach((location, index) => {
      if (!filter || location.country === filter || (Array.isArray(filter) && filter.includes(location.country))) {
        if (!["Holy See", "MS Zaandam", "Luxembourg", "Diamond Princess", "San Marino", "Andorra", "Qatar"].includes(location.country))
          plotlyGraphs.push({
            x: property.includes("Shifted") ? days : daysWithDates,
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
      {/* <button onClick={() => setShowAnalysis(!showAnalysis)}>Show/Hide Analysis</button> */}
      <GridMe
        content={
          <div style={{ display: showAnalysis ? "block" : "none" }}>
            <h2>Daily Infected % - Raw Data</h2>
            <p>Since we're only examining the total number of confirmed cases, not accounting for decreases like recovery and death, the total number of cases in every country/region increases or remains constant. (Decreases represent corrected data)</p>
            <p>Almost all regions show 1 of 3 possible parts of the <b>logistic graph</b>: a curved ramp-up (Russia), or a curved ramp-up into roughly a line (US), or an upward curve into a line which curves toward horizontal (Spain), which is a logistic curve.</p>
            <p>So far, these patterns don't directly suggest chaos: it still seems possible there might be some parameters which control the shape of the curves predictably, potentially population density, weather patterns, etc.</p>
            <p><b>Double click/tap</b> on a region in the key on the right to focus on that country. Then <b>single click/tap</b> on more regions to compare.</p>
            <p>When comparing data from different regions, it's most important to look at the <i>percent of each region that is infected</i>, instead of the plain number of infections. This helps "level the field" between regions by considering their different population sizes.</p>
          </div>
        }
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "valuesPerCapita" })}
            layout={{
              title: 'Daily Coronavirus Cases by Country, as a Percentage of Population',
              width: 3 / 5 * width,
              xaxis: {
                dtick: 3,
                title: "Date"
              },
              yaxis: { title: "% Infected" }
            }}
          />
        }
      />

      <GridMe
        content={
          <div style={{ display: showAnalysis ? "block" : "none" }}>
            <h2>Daily Infected % - Shifted to Start Date</h2>
            <p>In the second graph, we can see the infected percentage compared to days since the first infection in a country. This graph is more revealing.</p>
            <p>Interestingly, <b>only 72 days</b> after the first case in <b>Iceland</b>, the country has almost completely <b>stopped</b> the spread. Meanwhile, the <b>US is 107 days in and still seeing almost linear positive spread.</b></p> On the other hand, the <b>infected percentage climbed much higher and faster in Iceland than the US</b>.
            <p>These differences begin to point at an unpredictable system.</p>
          </div>
        }
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "valuesPerCapitaShifted" })}
            layout={{
              title: 'Daily Coronavirus Cases by Country, as a Percentage of Population,<br>Related to Days-Since-Patient-Zero in Each Country',
              width: 3 / 5 * width,
              xaxis: {
                dtick: 5,
                title: "Days since first patient in country"
              },
              yaxis: { title: "% Infected" }
            }}
          />
        }
      />

      <GridMe
        content={
          <div style={{ display: showAnalysis ? "block" : "none" }}>
            <h2>Rate of Spread - First Derivative</h2>
            <p>While the raw data shows mostly upward trajectories with some small bumps and jumps, the daily rate of growth shows a lot of variation.</p>
            <p>For example, in the US from day 67 to day 74 (), just one week, the daily growth rate decreases by ~30% and increases back to almost the same starting point.</p>
            <p>We also see drastically different behavior between different regions, unlike the roughly logistic graphs of the Raw Data.</p>
            <p>For example, compare the spread rates of the US and Spain. By March 24th, the spread rate in Spain started to decline, while the US spread rate was just starting to increase. There are numerous different patterns exhibited between different pairs of countries.</p>
            <p>The amount of unpredictable variation within a country and different possible models for each country suggest chaos.</p>
            <p>However, most countries still follow a very rough pattern of increasing and then leveling-off and decreasing spread rates, so we continue to investigate.</p>
          </div>
        }
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "derivativesPerCapitaShifted" })}
            layout={{
              title: 'Derivative of Daily Coronavirus Cases, by Country,<br>Related to Days-Since-Patient-Zero in Each Country', width: 3 / 5 * width, xaxis: {
                dtick: 5,
                title: "Days since first patient in country"
              }
            }}
          />
        }
      />

      <GridMe
        content={
          <div style={{ display: showAnalysis ? "block" : "none" }}>
            <h2>Is COVID Spreading Faster or Slower?<br />Second Derivative</h2>
            <p>Even without a mathematical understanding of the term, someone could call this "chaotic."</p>
            <p>The second derivative, the rate of change of the spread rate, represents activity in a system which changes its behavior.</p>
            <p>The rate of change of the spread rate in each region fluctuates greatly. The US seems to oscillate between roughly two values, Spain and Italy appear to exhibit a single heart-beat-like pulse surrounded by ramp-up and ramp-down, and Russia and Germany show clusters of high activity.</p>

            <h1>NEXT FIND WHAT CAUSES THIS ACTIVITY</h1>
          </div>
        }
        graph={
          <Plot
            data={formatLocationsForPlotly({ locations, property: "doubleDerivativesPerCapitaShifted" })}
            layout={{
              title: 'Second-derivative of Daily Coronavirus Cases, by Country,<br>Related to Days-Since-Patient-Zero in Each Country', width: 3 / 5 * width, xaxis: {
                dtick: 5,
                title: "Days since first patient in country"
              }
            }}
          />
        }
      />
      {showAnalysis && <RawDataTable data={data} headers={headers} />}
      {showAnalysis && <Sources />}
    </>
  )
}

const GridMe = ({ content, graph, className }) => (
  <div className={className}>
    {/* <div style={{ textAlign: "left", width: "35%", display: "inline-block", verticalAlign: "top", padding: 20 }}>
      {content}
    </div> */}
    <div style={{ textAlign: "center", display: "inline-block" }}>
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
      {/*https://www.ceicdata.com/en/indicator/taiwan/population
        https://www.worldometers.info/world-population/holy-see-population/
        https://www.hollandamerica.com/en_US/cruise-ships/ms-zaandam/3.html
        https://www.worldometers.info/world-population/western-sahara-population/
      */}
    </ol>
  )
}

export default App;
