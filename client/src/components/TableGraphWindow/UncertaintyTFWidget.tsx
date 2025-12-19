import classes from "./UncertaintyTFWidget.module.css";
import { observer } from "mobx-react";
import { useAppState } from "@/stores/appState.ts";
import GradientEditor from "@/components/GradientEditor/GradientEditor.tsx";

const UncertaintyTFWidget = observer(() => {
  const appState = useAppState();

  return (
    <div className={classes.container}>
      <GradientEditor
        gradientStopsHandler={appState.tfStops}
        binData={appState.dataset.normalizedConfidenceBins}
      />
    </div>
  );
});

export default UncertaintyTFWidget;
