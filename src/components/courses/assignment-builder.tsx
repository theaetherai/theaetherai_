'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  FilePenLine, 
  FileText, 
  FileImage, 
  FileArchive,
  FileCode, 
  Plus, 
  X, 
  GripVertical,
  BarChart2,
  ArrowUpDown, 
  Check, 
  GanttChartSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RubricItem {
  criteria: string;
  description: string;
  points: number;
}

interface AssignmentBuilderProps {
  rubric?: RubricItem[];
  onChange: (rubric: RubricItem[]) => void;
  fileTypes: string[];
  onFileTypesChange: (fileTypes: string[]) => void;
  disabled?: boolean;
}

export default function AssignmentBuilder({
  rubric = [],
  onChange,
  fileTypes = [],
  onFileTypesChange,
  disabled = false
}: AssignmentBuilderProps) {
  const [newCriteria, setNewCriteria] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPoints, setNewPoints] = useState(10);
  
  // Add a new rubric item
  const addRubricItem = () => {
    if (!newCriteria.trim()) return;
    
    const newItem: RubricItem = {
      criteria: newCriteria,
      description: newDescription,
      points: newPoints
    };
    
    onChange([...rubric, newItem]);
    
    // Reset the form
    setNewCriteria('');
    setNewDescription('');
    setNewPoints(10);
  };
  
  // Delete a rubric item
  const deleteRubricItem = (index: number) => {
    const newRubric = [...rubric];
    newRubric.splice(index, 1);
    onChange(newRubric);
  };
  
  // Add a file type
  const addFileType = (type: string) => {
    if (!fileTypes.includes(type)) {
      onFileTypesChange([...fileTypes, type]);
    }
  };
  
  // Remove a file type
  const removeFileType = (type: string) => {
    onFileTypesChange(fileTypes.filter(t => t !== type));
  };
  
  // Common file types with their icons
  const commonFileTypes = [
    { value: '.pdf', label: 'PDF', icon: FileText },
    { value: '.doc,.docx', label: 'Word', icon: FilePenLine },
    { value: '.jpg,.jpeg,.png', label: 'Images', icon: FileImage },
    { value: '.zip,.rar', label: 'Archives', icon: FileArchive },
    { value: '.js,.ts,.html,.css,.py', label: 'Code', icon: FileCode },
  ];
  
  // Calculate total points
  const totalPoints = rubric.reduce((sum, item) => sum + item.points, 0);
  
  return (
    <div className="space-y-8">
      {/* File Types Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Allowed File Types</Label>
          
          <Select 
            onValueChange={addFileType}
            disabled={disabled}
          >
            <SelectTrigger className="w-[200px] bg-[#2A2A2A] border-[#3A3A3A]">
              <SelectValue placeholder="Add file type" />
            </SelectTrigger>
            <SelectContent className="bg-[#2A2A2A] border-[#3A3A3A]">
              {commonFileTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {fileTypes.length === 0 ? (
            <p className="text-sm text-[#9D9D9D] italic">
              No file types selected. Students will be able to submit any file type.
            </p>
          ) : (
            fileTypes.map((type) => {
              // Find the matching common file type for the icon
              const fileTypeInfo = commonFileTypes.find(t => t.value.includes(type)) || {
                label: type.replace('.', '').toUpperCase(),
                icon: FileText
              };
              
              return (
                <Badge 
                  key={type} 
                  variant="secondary" 
                  className="py-1 px-3 rounded-full bg-[#2A2A2A] text-white border border-[#3A3A3A] flex items-center gap-1"
                >
                  <fileTypeInfo.icon className="h-3 w-3" />
                  <span>{fileTypeInfo.label}</span>
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFileType(type)}
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </Badge>
              );
            })
          )}
        </div>
      </div>
      
      {/* Rubric Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base">Grading Rubric</Label>
          
          <div className="flex items-center gap-1 text-sm text-[#9D9D9D]">
            <BarChart2 className="h-4 w-4" />
            <span>Total: {totalPoints} points</span>
          </div>
        </div>
        
        {rubric.length > 0 && (
          <Card className="border-[#3A3A3A] bg-[#1A1A1A]">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[#2A2A2A]">
                  <TableRow className="border-[#3A3A3A] hover:bg-[#2A2A2A]">
                    <TableHead className="w-[200px]">Criteria</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right w-[100px]">Points</TableHead>
                    {!disabled && <TableHead className="w-[50px]"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubric.map((item, index) => (
                    <TableRow key={index} className="border-[#3A3A3A] hover:bg-[#2A2A2A]/50">
                      <TableCell className="font-medium">{item.criteria}</TableCell>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.points}</TableCell>
                      {!disabled && (
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteRubricItem(index)}
                            className="h-7 w-7 p-0 text-red-400 hover:text-red-300 hover:bg-[#2A2A2A]"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        
        {!disabled && (
          <Card className="border-[#3A3A3A] bg-[#1A1A1A]">
            <CardHeader className="border-b border-[#3A3A3A] pb-3">
              <CardTitle className="text-base">Add Rubric Item</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="criteria">Criteria</Label>
                  <Input
                    id="criteria"
                    value={newCriteria}
                    onChange={(e) => setNewCriteria(e.target.value)}
                    placeholder="e.g., Content Quality"
                    className="bg-[#2A2A2A] border-[#3A3A3A]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    value={newPoints}
                    onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
                    min="0"
                    max="100"
                    className="bg-[#2A2A2A] border-[#3A3A3A]"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Explain what you're looking for"
                  className="bg-[#2A2A2A] border-[#3A3A3A]"
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-[#3A3A3A] pt-3 flex justify-between">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setNewCriteria('');
                  setNewDescription('');
                  setNewPoints(10);
                }}
                className="text-[#9D9D9D]"
              >
                Clear
              </Button>
              
              <Button
                type="button"
                onClick={addRubricItem}
                disabled={!newCriteria.trim()}
                className="bg-[#2A2A2A] hover:bg-[#3A3A3A]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Rubric
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {rubric.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 border border-dashed border-[#3A3A3A] rounded-lg bg-[#1A1A1A]/50">
            <GanttChartSquare className="h-12 w-12 text-[#3A3A3A] mb-3" />
            <h3 className="text-lg font-medium text-white mb-1">No Rubric Items</h3>
            <p className="text-[#9D9D9D] text-center mb-4 max-w-md">
              Create a rubric to help students understand how they'll be graded and to make assessment easier.
            </p>
            {!disabled && (
              <Button 
                onClick={() => {
                  setNewCriteria('Content Quality');
                  setNewDescription('Demonstrates understanding of the topic');
                  setNewPoints(10);
                }}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Criteria
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 