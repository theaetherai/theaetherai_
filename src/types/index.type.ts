export type WorkspaceProps = {
  data: {
    subscription: {
      plan: 'FREE' | 'PRO'
    } | null
    workspace: {
      id: string
      name: string
      type: 'PUBLIC' | 'PERSONAL'
    }[]
    members: {
      WorkSpace: {
        id: string
        name: string
        type: 'PUBLIC' | 'PERSONAL'
      }
    }[]
  
  }
}

export type NotificationProps = {
  status: number
  data: {
    _count: {
      notification: number
    }
  }
}

export type FolderProps = {
  status: number
  data: {
    name: string
    _count: {
      videos: number
    }
  }
}

export type VideosProps = {
  status: number
  data: {
    User: {
      firstname: string | null
      lastname: string | null
      image: string | null
    } | null
    id: string
    processing: boolean
    Folder: {
      id: string
      name: string
    } | null
    createdAt: Date
    title: string | null
    source: string
  }[]
}

export type VideoProps = {
  status: number
  data: {
    User: {
      firstname: string | null
      lastname: string | null
      image: string | null
      clerkId: string
      trial: boolean
      subscription: {
        plan: 'PRO' | 'FREE'
      } | null
    } | null
    title: string | null
    description: string | null
    source: string
    views: number
    createdAt: Date
    processing: boolean
    summery: string
    aiKeywords: string[]
  }
  author: boolean
}

export type CommentRepliesProps = {
  id: string
  comment: string
  createdAt: Date
  commentId: string | null
  userId: string | null
  videoId: string | null
  User: {
    id: string
    email: string
    firstname: string | null
    lastname: string | null
    createdAt: Date
    clerkid: string
    image: string | null
    trial: boolean
    firstView: boolean
  } | null
}

export type VideoCommentProps = {
  data: {
    User: {
      id: string
      email: string
      firstname: string | null
      lastname: string | null
      createdAt: Date
      clerkid: string
      image: string | null
      trial: boolean
      firstView: boolean
    } | null
    reply: CommentRepliesProps[]
    id: string
    comment: string
    createdAt: Date
    commentId: string | null
    userId: string | null
    videoId: string | null
  }[]
}

export type CourseProps = {
  status: number
  data: {
    id: string
    title: string
    description: string | null
    createdAt: Date
    updatedAt: Date
    userId: string | null
    User: {
      firstname: string | null
      lastname: string | null
      image: string | null
    } | null
    _count?: {
      lessons: number
      enrollments: number
    }
  }[]
}

export type LessonProps = {
  status: number
  data: {
    id: string
    title: string
    content: string | null
    order: number
    createdAt: Date
    updatedAt: Date
    courseId: string | null
    videoId: string | null
    Video: {
      title: string | null
      source: string
    } | null
    Course: {
      title: string
    } | null
  }[]
}

export type EnrollmentProps = {
  status: number
  data: {
    id: string
    createdAt: Date
    updatedAt: Date
    userId: string | null
    courseId: string | null
    User: {
      firstname: string | null
      lastname: string | null
      image: string | null
    } | null
    Course: {
      title: string
    } | null
  }[]
}

export type LearningProgressProps = {
  status: number
  data: {
    id: string
    createdAt: Date
    updatedAt: Date
    completed: boolean
    userId: string | null
    lessonId: string | null
    Lesson: {
      title: string
    } | null
  }[]
}
