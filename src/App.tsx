// src/App.tsx
import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { SchemaVisualizer } from "./SchemaVisualizer/SchemaVisualizer";
import ReactFlow, { ReactFlowProvider } from "reactflow";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";

function App() {
  return (
    <ChakraProvider>
      <WebSocketProvider>
        <ReactFlowProvider>
          <BrowserRouter>
            <Routes>
              {/* <Route path="/" element={<Home />} /> */}
              <Route path="/:diagramId" element={<SchemaVisualizer />} />
            </Routes>
          </BrowserRouter>
        </ReactFlowProvider>
      </WebSocketProvider>
    </ChakraProvider>
  );
}

export default App;
