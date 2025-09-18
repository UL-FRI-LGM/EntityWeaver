import "./App.css";
import EntityGraph from "./EntityGraph.tsx";
import { observer } from "mobx-react";
import { useMst } from "./stores/rootStore.ts";

const App = observer(() => {
  const rootStore = useMst();

  function test() {
    console.log(rootStore.sigma);
    const camera = rootStore.sigma?.getCamera();
    camera?.animatedReset();
  }

  return (
    <div className="app">
      Test
      <div>{rootStore.isForceAtlasRunning ? "True" : "False"}</div>
      <button onClick={test} type="button">
        AA
      </button>
      <EntityGraph />
    </div>
  );
});

export default App;
