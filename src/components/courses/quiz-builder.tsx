'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Grip, 
  Plus, 
  Trash2, 
  GripVertical, 
  ArrowUpDown, 
  ThumbsUp, 
  AlertCircle, 
  HelpCircle,
  FileQuestion,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

interface QuestionOption {
  text: string;
  isCorrect: boolean;
}

interface Question {
  text: string;
  explanation?: string;
  type: 'multipleChoice' | 'trueFalse' | 'shortAnswer' | 'essay';
  points: number;
  options: QuestionOption[];
}

interface QuizBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  disabled?: boolean;
}

export default function QuizBuilder({ 
  questions, 
  onChange, 
  disabled = false 
}: QuizBuilderProps) {
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(
    questions.length === 0 ? null : 0
  );
  
  // Add a new question
  const addQuestion = () => {
    const newQuestion: Question = {
      text: '',
      explanation: '',
      type: 'multipleChoice',
      points: 1,
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ]
    };
    
    const newQuestions = [...questions, newQuestion];
    onChange(newQuestions);
    setExpandedQuestion(newQuestions.length - 1);
  };
  
  // Delete a question
  const deleteQuestion = (index: number) => {
    const newQuestions = [...questions];
    newQuestions.splice(index, 1);
    onChange(newQuestions);
    
    if (expandedQuestion === index) {
      setExpandedQuestion(null);
    } else if (expandedQuestion !== null && expandedQuestion > index) {
      setExpandedQuestion(expandedQuestion - 1);
    }
  };
  
  // Update a question
  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = {
      ...newQuestions[index],
      [field]: value
    };
    
    // If changing to trueFalse type, adjust options
    if (field === 'type' && value === 'trueFalse') {
      newQuestions[index].options = [
        { text: 'True', isCorrect: false },
        { text: 'False', isCorrect: false }
      ];
    }
    
    // If changing from shortAnswer or essay to a type with options
    if (field === 'type' && (value === 'multipleChoice' || value === 'trueFalse') && 
        (newQuestions[index].options.length === 0 || 
         questions[index].type === 'shortAnswer' || 
         questions[index].type === 'essay')) {
      
      if (value === 'trueFalse') {
        newQuestions[index].options = [
          { text: 'True', isCorrect: false },
          { text: 'False', isCorrect: false }
        ];
      } else {
        newQuestions[index].options = [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ];
      }
    }
    
    onChange(newQuestions);
  };
  
  // Add an option to a question
  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({
      text: '',
      isCorrect: false
    });
    onChange(newQuestions);
  };
  
  // Delete an option from a question
  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.splice(optionIndex, 1);
    onChange(newQuestions);
  };
  
  // Update an option
  const updateOption = (questionIndex: number, optionIndex: number, field: keyof QuestionOption, value: any) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value
    };
    
    // For true/false questions, ensure only one option is correct
    if (newQuestions[questionIndex].type === 'trueFalse' && field === 'isCorrect' && value === true) {
      newQuestions[questionIndex].options.forEach((opt, idx) => {
        if (idx !== optionIndex) {
          opt.isCorrect = false;
        }
      });
    }
    
    // For multiple choice questions, if we have radio-style behavior
    if (newQuestions[questionIndex].type === 'multipleChoice' && field === 'isCorrect' && value === true) {
      newQuestions[questionIndex].options.forEach((opt, idx) => {
        if (idx !== optionIndex) {
          opt.isCorrect = false;
        }
      });
    }
    
    onChange(newQuestions);
  };
  
  // Move a question up or down
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap questions
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    onChange(newQuestions);
    
    // Update expanded question
    if (expandedQuestion === index) {
      setExpandedQuestion(newIndex);
    } else if (expandedQuestion === newIndex) {
      setExpandedQuestion(index);
    }
  };
  
  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg bg-background/50">
          <FileQuestion className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-base font-medium text-foreground mb-1">No Questions Yet</h3>
          <p className="text-muted-foreground text-sm text-center mb-3 max-w-md">
            Add your first question to create an interactive quiz for your students.
          </p>
          <Button 
            onClick={addQuestion}
            disabled={disabled}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add First Question
          </Button>
        </div>
      ) : (
        <>
          {questions.map((question, questionIndex) => (
            <Card key={questionIndex} variant={expandedQuestion === questionIndex ? "elevated" : "default"} className={cn(
              "border-border",
              expandedQuestion === questionIndex ? "bg-background" : "bg-background/60"
            )}>
              <CardHeader className="px-4 py-3" onClick={() => setExpandedQuestion(
                expandedQuestion === questionIndex ? null : questionIndex
              )}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary text-lg font-medium w-7 h-7 rounded-full flex items-center justify-center">
                      {questionIndex + 1}
                    </span>
                    <div className="font-medium text-foreground text-sm line-clamp-1">
                      {question.text || <span className="text-muted-foreground italic">Untitled Question</span>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-secondary-foreground">
                      {question.points} {question.points === 1 ? 'pt' : 'pts'}
                    </span>
                    
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/30 text-secondary-foreground capitalize">
                      {question.type === 'multipleChoice' 
                        ? 'Multiple Choice' 
                        : question.type === 'trueFalse'
                        ? 'True/False'
                        : question.type === 'shortAnswer'
                        ? 'Short Answer'
                        : 'Essay'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              
              {expandedQuestion === questionIndex && (
                <CardContent className="px-4 pb-4 space-y-4">
                  {/* Question text */}
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Question</Label>
                    <Textarea
                      value={question.text}
                      onChange={(e) => {
                        e.preventDefault();
                        updateQuestion(questionIndex, 'text', e.target.value);
                      }}
                      placeholder="Enter your question here"
                      disabled={disabled}
                      className="min-h-[80px] text-sm resize-none"
                      onKeyDown={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  {/* Question type and points */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Question Type</Label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(
                          questionIndex, 
                          'type', 
                          value as 'multipleChoice' | 'trueFalse' | 'shortAnswer' | 'essay'
                        )}
                        disabled={disabled}
                      >
                        <SelectTrigger className="bg-background border-input text-foreground text-sm">
                          <SelectValue placeholder="Select question type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border-border">
                          <SelectItem value="multipleChoice">Multiple Choice</SelectItem>
                          <SelectItem value="trueFalse">True/False</SelectItem>
                          <SelectItem value="shortAnswer">Short Answer</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Points</Label>
                      <Input
                        variant="outlined"
                        type="number"
                        min="1"
                        value={question.points}
                        onChange={(e) => updateQuestion(questionIndex, 'points', parseInt(e.target.value) || 1)}
                        disabled={disabled}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Question explanation */}
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Explanation (Optional)</Label>
                    <Textarea
                      variant="outlined"
                      value={question.explanation || ''}
                      onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                      placeholder="Explain the correct answer or provide context"
                      disabled={disabled}
                      className="h-20 text-sm resize-none"
                    />
                  </div>
                  
                  {/* Question Options (for multiple choice and true/false) */}
                  {(question.type === 'multipleChoice' || question.type === 'trueFalse') && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium mb-1.5 block">Answer Options</Label>
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Checkbox
                              id={`q${questionIndex}-opt${optionIndex}`}
                              checked={option.isCorrect}
                              onCheckedChange={(checked) => 
                                updateOption(questionIndex, optionIndex, 'isCorrect', !!checked)
                              }
                              disabled={disabled}
                              className="border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            
                            <Input 
                              variant="outlined"
                              value={option.text}
                              onChange={(e) => 
                                updateOption(questionIndex, optionIndex, 'text', e.target.value)
                              }
                              placeholder={`Option ${optionIndex + 1}`}
                              disabled={disabled || question.type === 'trueFalse'}
                              className="flex-1 text-sm"
                            />
                            
                            {question.type === 'multipleChoice' && question.options.length > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOption(questionIndex, optionIndex)}
                                disabled={disabled}
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {question.type === 'multipleChoice' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(questionIndex)}
                          disabled={disabled}
                          className="mt-2 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Option
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Answer description for short answer */}
                  {question.type === 'shortAnswer' && (
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Expected Answer</Label>
                      <Textarea
                        variant="outlined"
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                        placeholder="What is the expected answer? This will be used to guide grading."
                        disabled={disabled}
                        className="h-20 text-sm resize-none"
                      />
                    </div>
                  )}
                  
                  {/* Essay grading guidelines */}
                  {question.type === 'essay' && (
                    <div>
                      <Label className="text-sm font-medium mb-1.5 block">Grading Guidelines</Label>
                      <Textarea
                        variant="outlined"
                        value={question.explanation || ''}
                        onChange={(e) => updateQuestion(questionIndex, 'explanation', e.target.value)}
                        placeholder="Provide guidelines for how this essay should be evaluated."
                        disabled={disabled}
                        className="h-20 text-sm resize-none"
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
          
          <Button
            onClick={addQuestion}
            disabled={disabled}
            variant="outline"
            size="sm"
            className="w-full border-dashed border-border"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </>
      )}
    </div>
  );
} 