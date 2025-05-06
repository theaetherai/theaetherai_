'use client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  shortDescription: z.string().optional(),
  price: z.number().optional(),
  discountPrice: z.number().optional(),
  thumbnailUrl: z.string().min(1, "Thumbnail is required"),
  category: z.string().optional(),
  level: z.string().optional(),
  bestseller: z.boolean().default(false),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  published: z.boolean().default(false),
  requirements: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  targetAudience: z.string().optional(),
  currentStep: z.number().default(1),
});

type FormValues = z.infer<typeof formSchema>

interface Course {
  id?: string
  title: string
  description?: string | null
  shortDescription?: string | null
  price?: number | null
  discountPrice?: number | null
  thumbnailUrl?: string | null
  category?: string | null
  level?: string | null
  bestseller?: boolean
  featured?: boolean
  popular?: boolean
  published?: boolean
  requirements?: string[]
  objectives?: string[]
  targetAudience?: string | null
  currentStep?: number
}

interface CourseFormProps {
  initialData?: Course
  courseId?: string
  isEditing?: boolean
  onCourseCreated?: (course: Course) => void
  onCourseUpdated?: (course: Course) => void
}

export default function CourseForm({
  initialData,
  courseId,
  isEditing = false,
  onCourseCreated,
  onCourseUpdated
}: CourseFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [newRequirement, setNewRequirement] = useState('')
  const [newObjective, setNewObjective] = useState('')
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      shortDescription: initialData?.shortDescription || '',
      price: initialData?.price || undefined,
      discountPrice: initialData?.discountPrice || undefined,
      thumbnailUrl: initialData?.thumbnailUrl || '',
      category: initialData?.category || '',
      level: initialData?.level || '',
      bestseller: initialData?.bestseller || false,
      featured: initialData?.featured || false,
      popular: initialData?.popular || false,
      published: initialData?.published || false,
      requirements: initialData?.requirements || [],
      objectives: initialData?.objectives || [],
      targetAudience: initialData?.targetAudience || '',
      currentStep: initialData?.currentStep || 1,
    }
  })
  
  const handleAddRequirement = () => {
    if (newRequirement.trim() !== '') {
      const currentRequirements = form.getValues('requirements');
      form.setValue('requirements', [...currentRequirements, newRequirement]);
      setNewRequirement('');
    }
  }
  
  const handleRemoveRequirement = (index: number) => {
    const currentRequirements = form.getValues('requirements');
    form.setValue('requirements', currentRequirements.filter((_, i) => i !== index));
  }
  
  const handleAddObjective = () => {
    if (newObjective.trim() !== '') {
      const currentObjectives = form.getValues('objectives');
      form.setValue('objectives', [...currentObjectives, newObjective]);
      setNewObjective('');
    }
  }
  
  const handleRemoveObjective = (index: number) => {
    const currentObjectives = form.getValues('objectives');
    form.setValue('objectives', currentObjectives.filter((_, i) => i !== index));
  }
  
  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true)
      
      if (isEditing && courseId) {
        // Update existing course
        const response = await axios.patch(`/api/courses/${courseId}`, values)
        
        if (response.data.status === 200) {
          toast.success('Course updated successfully')
          
          if (onCourseUpdated) {
            onCourseUpdated(response.data.data)
          } else {
            router.push(`/courses/${courseId}`)
            router.refresh()
          }
        }
      } else {
        // Create new course
        const response = await axios.post('/api/courses', values)
        
        if (response.data.status === 201) {
          toast.success('Course created successfully')
          
          if (onCourseCreated) {
            onCourseCreated(response.data.data)
          } else {
            router.push(`/courses/${response.data.data.id}`)
            router.refresh()
          }
        }
      }
    } catch (error) {
      toast.error(isEditing ? 'Failed to update course' : 'Failed to create course')
    } finally {
      setIsLoading(false)
    }
  }
  
  const categories = [
    'Development',
    'Business',
    'IT & Software',
    'Personal Development',
    'Design',
    'Marketing',
    'Finance',
    'Health & Fitness',
    'Music',
    'Photography & Video',
    'Other'
  ]
  
  const levels = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'All Levels'
  ]
  
  return (
    <div className="max-w-4xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="requirements">Requirements & Goals</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground text-sm">Course Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g. Advanced Web Development with React"
                        disabled={isLoading}
                        className="bg-background border-input text-foreground"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Give your course a clear, specific title.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Short Description</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Brief overview of your course (displayed on cards)"
                        disabled={isLoading}
                        className="bg-background border-input text-foreground"
                      />
                    </FormControl>
                    <FormDescription>
                      A brief summary shown on course cards (max 200 characters).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your course..."
                        className={cn(
                          "min-h-[120px]",
                          form.formState.errors.description && "border-red-500"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of your course
                    </FormDescription>
                    {form.formState.errors.description && (
                      <FormMessage className="text-red-500">
                        {form.formState.errors.description.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-input text-foreground">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border-input text-foreground">
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best fits your course content.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Level</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-background border-input text-foreground">
                          <SelectValue placeholder="Select a difficulty level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background border-input text-foreground">
                        {levels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the appropriate skill level for your target audience.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
            
            <TabsContent value="details" className="space-y-6">
              <FormField
                control={form.control}
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Thumbnail *</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <Input 
                          placeholder="Enter image URL" 
                          {...field}
                          className={cn(
                            "w-full",
                            form.formState.errors.thumbnailUrl && "border-red-500"
                          )}
                        />
                        {field.value && (
                          <div className="relative w-20 h-20">
                            <img
                              src={field.value}
                              alt="Course thumbnail"
                              className="object-cover rounded-md w-full h-full"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Add a thumbnail image for your course
                    </FormDescription>
                    {form.formState.errors.thumbnailUrl && (
                      <FormMessage className="text-red-500">
                        {form.formState.errors.thumbnailUrl.message}
                      </FormMessage>
                    )}
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="99.99"
                          disabled={isLoading}
                          className="bg-background border-input text-foreground"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Regular price of your course in USD.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="discountPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Discount Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="19.99"
                          disabled={isLoading}
                          className="bg-background border-input text-foreground"
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value === undefined ? '' : field.value}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional promotional or discounted price.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="targetAudience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Target Audience</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe who this course is for..."
                        disabled={isLoading}
                        className="min-h-[100px] bg-background border-input text-foreground"
                      />
                    </FormControl>
                    <FormDescription>
                      Describe the specific audience who will benefit most from this course.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="bestseller"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-foreground">Bestseller</FormLabel>
                        <FormDescription>Mark this course as a bestseller</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-foreground">Featured</FormLabel>
                        <FormDescription>Feature this course on the homepage</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="popular"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-foreground">Popular</FormLabel>
                        <FormDescription>Mark as a popular course</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-input p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base text-foreground">Published</FormLabel>
                        <FormDescription>Make this course available to students</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          className="data-[state=checked]:bg-primary"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="requirements" className="space-y-6">
              <div>
                <Label className="text-foreground mb-2 block">Course Requirements</Label>
                <div className="flex mb-4">
                  <Input
                    value={newRequirement}
                    onChange={(e) => setNewRequirement(e.target.value)}
                    placeholder="e.g. Basic programming knowledge"
                    className="flex-1 bg-background border-input text-foreground mr-2"
                    disabled={isLoading}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddRequirement} 
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {form.watch('requirements').map((requirement, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-background/70 px-3 py-2 rounded-md"
                    >
                      <span className="text-foreground">• {requirement}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveRequirement(index)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.watch('requirements').length === 0 && (
                    <p className="text-sm text-muted-foreground">No requirements added yet.</p>
                  )}
                </div>
                <FormDescription className="mt-2">
                  List what students need to know before starting this course.
                </FormDescription>
              </div>
              
              <div>
                <Label className="text-foreground mb-2 block">Learning Objectives</Label>
                <div className="flex mb-4">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="e.g. Build a complete web application"
                    className="flex-1 bg-background border-input text-foreground mr-2"
                    disabled={isLoading}
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddObjective} 
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {form.watch('objectives').map((objective, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-background/70 px-3 py-2 rounded-md"
                    >
                      <span className="text-foreground">• {objective}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveObjective(index)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive/90 hover:bg-transparent"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.watch('objectives').length === 0 && (
                    <p className="text-sm text-muted-foreground">No objectives added yet.</p>
                  )}
                </div>
                <FormDescription className="mt-2">
                  Clearly outline what students will be able to do after completing this course.
                </FormDescription>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const currentStep = form.getValues('currentStep') || 1;
                  if (currentStep > 1) {
                    form.setValue('currentStep', currentStep - 1);
                  }
                }}
                disabled={form.getValues('currentStep') === 1}
              >
                Previous
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const currentStep = form.getValues('currentStep') || 1;
                  const isValid = await form.trigger();
                  if (isValid) {
                    form.setValue('currentStep', currentStep + 1);
                  }
                }}
                disabled={form.getValues('currentStep') === 3}
              >
                Next
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Course'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
} 