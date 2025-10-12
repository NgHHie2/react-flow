// src/App.tsx - Wrap WebSocketProvider
import React from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { WebSocketProvider } from "./contexts/WebSocketContext";
import { SchemaVisualizer } from "./SchemaVisualizer/SchemaVisualizer";

function App() {
  return (
    <ChakraProvider>
      <WebSocketProvider>
        <SchemaVisualizer />
      </WebSocketProvider>
    </ChakraProvider>
  );
}

export default App;
