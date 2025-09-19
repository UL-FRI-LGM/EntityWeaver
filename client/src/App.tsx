import "./App.css";
import EntityGraph from "./EntityGraph.tsx";
import { observer } from "mobx-react";
import { useMst } from "./stores/rootStore.ts";
import RightWidget from "./components/RightWidget/RightWidget.tsx";
import TopBar from "./components/TopBar/TopBar.tsx";

const App = observer(() => {
  const rootStore = useMst();

  function test() {
    console.log(rootStore.sigma);
    const camera = rootStore.sigma?.getCamera();
    camera?.animatedReset();
  }

  return (
    <div className="app">
      <TopBar />
      <div className="main">
        <EntityGraph />
        <RightWidget />
      </div>
    </div>
  );
});

export default App;
