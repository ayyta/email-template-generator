"use client";

import { useRef, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import ParsedTemplateList from "@/components/ParsedTemplateList";

export default function PromptReplacer() {
  const [template, setTemplate] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [datasetNames, setDatasetNames] = useState(["email"]);
  const [dataset, setDataset] = useState([{}]);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [isTableFocused, setIsTableFocused] = useState(false);
  const [generatedTemplates, setGeneratedTemplates] = useState([]);
  const tableRef = useRef(null);

  // Save to local storage
  useEffect(() => {
    const storedTemplate = localStorage.getItem("template");
    const storedSubject = localStorage.getItem("subjectLine");
    const storedDatasetNames = localStorage.getItem("datasetNames");
    const storedDataset = localStorage.getItem("dataset");
  
    if (storedTemplate) setTemplate(storedTemplate);
    if (storedSubject) setSubjectLine(storedSubject);
    if (storedDatasetNames) setDatasetNames(JSON.parse(storedDatasetNames));
    if (storedDataset) setDataset(JSON.parse(storedDataset));
  }, []);

  useEffect(() => {
    localStorage.setItem("template", template);
  }, [template]);
  
  useEffect(() => {
    localStorage.setItem("subjectLine", subjectLine);
  }, [subjectLine]);
  
  useEffect(() => {
    localStorage.setItem("datasetNames", JSON.stringify(datasetNames));
  }, [datasetNames]);
  
  useEffect(() => {
    localStorage.setItem("dataset", JSON.stringify(dataset));
  }, [dataset]);

  const handleGenerate = () => {
    setGeneratedTemplates([]);
    setGeneratedTemplates(
      dataset.map((data) => {
        let parsedTemplate = template;
        datasetNames.forEach((key) => {
          const regex = new RegExp(`\\[${key}\\]`, "g");
          parsedTemplate = parsedTemplate.replace(regex, data[key] || "");
        });
        return {
          email: data.email || "",
          subject: subjectLine,
          body: parsedTemplate,
        };
      })
    );
  };
  useEffect(() => {
    const keys = template.match(/\[(.*?)\]/g);
    if (keys) {
      const newDatasetNames = keys.map((key) => key.replace("[", "").replace("]", ""));
      // Add email to first row if not in keys
      if (!newDatasetNames.includes("email")) {
        newDatasetNames.unshift("email");
      }
      setDatasetNames(newDatasetNames);
    }

  }, [template]);

  // Append new row if last row is not empty
  const handleDatasetChange = (index, key, value) => {
    const newDataset = [...dataset];
    newDataset[index] = { ...newDataset[index], [key]: value };
    setDataset(newDataset);
  };

  // Select cells on mouse down and adds to selected cells when ctrl + click
  const handleMouseDown = (rowIndex, key, e) => {
    setIsTableFocused(true);
    setIsSelecting(true);
    const cellId = `${rowIndex}-${key}`;
    setSelectedCells(new Set(e.ctrlKey ? [...selectedCells, cellId] : [cellId]));
  };

  // 
  const handleMouseEnter = (rowIndex, key) => {
    if (isSelecting) {
      const cellId = `${rowIndex}-${key}`;
      setSelectedCells((prev) => new Set([...prev, cellId]));
    }
  };

  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  const handleDeleteSelected = () => {
    setDataset((prevDataset) => {
      // Step 1: Clear selected cells
      const updatedDataset = prevDataset.map((row, rowIndex) => {
        const newRow = { ...row };
        datasetNames.forEach((key) => {
          if (selectedCells.has(`${rowIndex}-${key}`)) {
            newRow[key] = ""; // Clear selected cells
          }
        });
        return newRow;
      });
  
      // Step 2: Remove rows that are completely empty
      const filteredDataset = updatedDataset.filter((row) =>
        datasetNames.some((key) => row[key]?.trim() !== "") // Keep rows with at least one non-empty value
      );
  
      return filteredDataset.length > 0 ? filteredDataset : [{}]; // Ensure at least one empty row remains
    });

    setSelectedCells(new Set());
  };

  const handleArrowNavigation = (e, rowIndex, colIndex) => {
    if (!tableRef.current || datasetNames.length === 0) return;
    const inputs = Array.from(tableRef.current.querySelectorAll("[contenteditable]"));
    if (!inputs.length) return;
    
    let index = rowIndex * datasetNames.length + colIndex;
    let newRowIndex = rowIndex;
    let newColIndex = colIndex;

    const currentCell = inputs[index];
    const currentText = currentCell.innerText.trim();

    // Only move to the next cell if the current cell is empty or you are at the end of the row
    if (e.key === "ArrowRight" && inputs[index + 1] && colIndex < datasetNames.length - 1) { 
      const selection = window.getSelection();
      const currentCursorPos = selection.focusOffset;
      const textLength = inputs[index].innerText.length;
    
      // Move only if cursor is at the end of the text or the cell is empty
      if (currentCursorPos === textLength || textLength === 0) {
        newColIndex += 1;
        const nextCell = inputs[index + 1];
        nextCell.focus();
    
        // Move cursor to the **start** of the next cell
        const range = document.createRange();
        const textNode = nextCell.childNodes[0] || nextCell;

        //range.selectNodeContents(nextCell);
        range.setStart(textNode, 0);
        range.collapse(true); // Moves to start
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (e.key === "ArrowLeft" && inputs[index - 1] && colIndex > 0) {
      const selection = window.getSelection();
      const currentCursorPos = selection.focusOffset;
    
      // Move only if cursor is at the start of text or the cell is empty
      if (currentCursorPos === 0 || inputs[index].innerText.length === 0) {
        newColIndex -= 1;
        const prevCell = inputs[index - 1];
        prevCell.focus();
    
        // Move cursor to the **end** of the previous cell
        const range = document.createRange();
        range.selectNodeContents(prevCell);
        range.collapse(false); // Moves to end
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (e.key === "ArrowDown") {
      if (inputs[index + datasetNames.length]) {
        newRowIndex += 1;
        inputs[index + datasetNames.length].focus();
      } else if (rowIndex === dataset.length - 1) {
        setDataset((prevDataset) => {
          const newDataset = [...prevDataset, {}];
          return newDataset;
        });
        setTimeout(() => {
          const newInputs = Array.from(tableRef.current.querySelectorAll("[contenteditable]"));
          if (newInputs[index + datasetNames.length]) {
            newInputs[index + datasetNames.length].focus();
          }
        }, 0);
      }
    } else if (e.key === "ArrowUp" && inputs[index - datasetNames.length]) {
      newRowIndex -= 1;
      inputs[index - datasetNames.length].focus();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      
      // If there is only one selected cell and selected cell is empty, delete the row
      if (selectedCells.size === 1 && !inputs[index].innerText.trim() && index % 2 == 1) {
        const isRowEmpty = datasetNames.every((key) => !dataset[rowIndex]?.[key]?.trim());
        if (isRowEmpty) {
          setDataset((prevDataset) => {
            const newDataset = prevDataset.filter((_, i) => i !== rowIndex);
            return newDataset.length > 0 ? newDataset : [{}];
          });
        }
        return;
      }
      
      // If there is only one selected cell and selected cell is not empty, skip the delete
      if (selectedCells.size === 1 && inputs[index].innerText.trim()) {
        return;
      }

      // Clear selected cells
      handleDeleteSelected();
    }

    setSelectedCells(new Set([`${newRowIndex}-${datasetNames[newColIndex]}`]));
  };

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [selectedCells, isTableFocused]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">Prompt Variable Replacer</h1>
      <textarea
        placeholder="Enter subject line"
        value={subjectLine}
        onChange={(e) => setSubjectLine(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Enter your prompt with placeholders like [name], [career]"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
        className="w-full p-2 border rounded"
      />
      
      <div ref={tableRef} onClick={() => setIsTableFocused(true)}>
        <Table className="border">
          <TableHeader>
            <TableRow>
              {datasetNames.map((name) => (
                <TableCell key={name}>{name}</TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataset.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {datasetNames.map((key, colIndex) => (
                  <TableCell
                    key={key}
                    className={selectedCells.has(`${rowIndex}-${key}`) ? "bg-gray-300" : ""}
                    onMouseDown={(e) => handleMouseDown(rowIndex, key, e)}
                    tabIndex={0}
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning={true}
                      onBlur={(e) => handleDatasetChange(rowIndex, key, e.target.innerText.trim())}
                      onKeyDown={(e) => handleArrowNavigation(e, rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, key)}
                      className="p-2 border rounded min-w-[100px]"
                    >
                      {row[key] || ""}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button onClick={handleDeleteSelected}>Delete Selected</Button>
      <Button onClick={handleGenerate}>Generate</Button>

      <ParsedTemplateList generatedTemplates={generatedTemplates} />
    </div>
  );
}


