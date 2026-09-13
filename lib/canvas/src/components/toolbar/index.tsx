import React, { useCallback } from 'react';
import { useCanvasStore } from '../CanvasContext';
import { Mode } from '../../types';

const Toolbar: React.FC = () => {
    const setMode = useCanvasStore(s => s.setMode);
    const setShapes = useCanvasStore(s => s.setShapes);

    const handleShapeSelect = useCallback(() => {
        setMode(Mode.DRAW);
    }, []);

    const onReset = useCallback(() => {
        setShapes([]);
    }, []);

    return (
        <div className="toolbar">
            <div className="toolbar-content">
                <button className="reset-btn" onClick={onReset}>
                    Reset
                </button>
                <button className="create-btn" onClick={handleShapeSelect}>
                    Create
                </button>
            </div>
        </div>
    );
};

export default Toolbar;