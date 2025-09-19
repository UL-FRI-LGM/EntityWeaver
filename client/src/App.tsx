import "./App.css";
import EntityGraph from "./EntityGraph.tsx";
import RightWidget from "./components/RightWidget/RightWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";

const App = () => {
  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <EntityGraph />
        <RightWidget />
      </div>
    </div>
  );
};

export default App;
