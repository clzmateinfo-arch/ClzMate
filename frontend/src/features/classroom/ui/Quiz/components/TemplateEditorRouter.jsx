import React from "react";
import MultipleEditor from "./templates/MultipleEditor";
import TrueFalseEditor from "./templates/TrueFalseEditor";
import ShortAnswerEditor from "./templates/ShortAnswerEditor";
import SliderEditor from "./templates/SliderEditor";
import PollEditor from "./templates/PollEditor";
import PuzzleEditor from "./templates/PuzzleEditor";

export default function TemplateEditorRouter({ screen, onChange, templates = [] }) {
    if (!screen) return null;
    const type = screen.type || "multiple";

    const commonProps = { screen, onChange, templates };

    switch (type) {
        case "multiple":
            return <MultipleEditor {...commonProps} />;
        case "truefalse":
            return <TrueFalseEditor {...commonProps} />;
        case "short":
            return <ShortAnswerEditor {...commonProps} />;
        case "slider":
            return <SliderEditor {...commonProps} />;
        case "poll":
            return <PollEditor {...commonProps} />;
        case "puzzle":
            return <PuzzleEditor {...commonProps} />;
        default:
            return <MultipleEditor {...commonProps} />;
    }
}
