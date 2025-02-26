"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

const ParsedTemplateList = ({ generatedTemplates }) => {
  const [editableTemplates, setEditableTemplates] = useState([]);

  useEffect(() => {
    setEditableTemplates(generatedTemplates);
  }, [generatedTemplates]);


  // Copies the text to the clipboard
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  // Changes the value of a template given an index and field
  const handleInputChange = (index, field, value) => {
    setEditableTemplates((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  return (
    <div className="space-y-4">

      {editableTemplates.length > 0 && (
        <div className="space-y-4">
          {editableTemplates.map((item, index) => (
            <Card key={index} className="p-4 border border-gray-300 rounded-lg">
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Email:</span>
                  <Button onClick={() => handleCopy(item.email)}>Copy</Button>
                </div>
                <Textarea 
                  className="w-full border p-2 rounded" 
                  value={item.email} 
                  onChange={(e) => handleInputChange(index, "email", e.target.value)}
                />

                <div className="flex justify-between items-center">
                  <span className="font-bold">Subject Line:</span>
                  <Button onClick={() => handleCopy(item.subject)}>Copy</Button>
                </div>
                <Textarea 
                  className="w-full border p-2 rounded" 
                  value={item.subject} 
                  onChange={(e) => handleInputChange(index, "subject", e.target.value)}
                />

                <div className="flex justify-between items-center">
                  <span className="font-bold">Parsed Template:</span>
                  <Button onClick={() => handleCopy(item.body)}>Copy</Button>
                </div>
                <Textarea 
                  className="w-full border p-2 rounded" 
                  value={item.body} 
                  onChange={(e) => handleInputChange(index, "body", e.target.value)}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ParsedTemplateList;
