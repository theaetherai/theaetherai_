'use server'

import { client } from '../lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { sendEmail } from './user'
import { createClient, OAuthStrategy } from '@wix/sdk'
import { items } from '@wix/data'
import axios from 'axios'
import { OpenAI } from 'openai'
import { unstable_noStore as noStore } from 'next/cache'

export const verifyAccessToWorkspace = async (workspaceId: string) => {
  try {
    const user = await currentUser()
    if (!user?.id) return { status: 403 }

    const isUserInWorkspace = await client.workSpace.findUnique({
      where: {
        id: workspaceId,
        OR: [
          {
            User: {
              clerkid: user.id,
            },
          },
          {
            members: {
              every: {
                User: {
                  clerkid: user.id,
                },
              },
            },
          },
        ],
      },
    })
    return {
      status: 200,
      data: { workspace: isUserInWorkspace },
    }
  } catch (error) {
    return {
      status: 403,
      data: { workspace: null },
    }
  }
}

export const getWorkspaceFolders = async (workSpaceId: string) => {
  try {
    const isFolders = await client.folder.findMany({
      where: {
        workSpaceId,
      },
      include: {
        _count: {
          select: {
            videos: true,
          },
        },
      },
    })
    if (isFolders && isFolders.length > 0) {
      return { status: 200, data: isFolders }
    }
    return { status: 404, data: [] }
  } catch (error) {
    return { status: 403, data: [] }
  }
}

export const getAllUserVideos = async (workSpaceId: string) => {
  try {
    const user = await currentUser()
    if (!user?.id) return { status: 404 }
    
    // Check if we're viewing a folder or the main workspace
    const isFolderView = await client.folder.findUnique({
      where: { id: workSpaceId },
      select: { id: true }
    })
    
    let query = {}
    
    if (isFolderView) {
      // If viewing a folder, get videos in that specific folder
      query = {
        folderId: workSpaceId
      }
    } else {
      // If viewing the main workspace, get videos that are not in any folder
      query = {
        workSpaceId,
        folderId: null // Only include videos that are not in a folder
      }
    }
    
    const videos = await client.video.findMany({
      where: query,
      select: {
        id: true,
        title: true,
        createdAt: true,
        source: true,
        processing: true,
        Folder: {
          select: {
            id: true,
            name: true,
          },
        },
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Show newest videos first
      },
    })

    if (videos && videos.length > 0) {
      return { status: 200, data: videos }
    }

    return { status: 404 }
  } catch (error) {
    return { status: 400 }
  }
}

export const getWorkSpaces = async (enableDynamicMode = false) => {
  // Prevent caching only if explicitly enabled
  if (enableDynamicMode) {
    noStore();
  }

  try {
    const user = await currentUser()

    if (!user?.id) return { status: 404 }

    const workspaces = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
        workspace: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        members: {
          select: {
            WorkSpace: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
    })

    if (workspaces) {
      return { status: 200, data: workspaces }
    }
  } catch (error) {
    return { status: 400 }
  }
}

export const createWorkspace = async (name: string) => {
  try {
    const user = await currentUser()
    if (!user?.id) return { status: 404 }
    const authorized = await client.user.findUnique({
      where: {
        clerkid: user.id,
      },
      select: {
        subscription: {
          select: {
            plan: true,
          },
        },
      },
    })

    if (authorized?.subscription?.plan === 'PRO') {
      const workspace = await client.user.update({
        where: {
          clerkid: user.id,
        },
        data: {
          workspace: {
            create: {
              name,
              type: 'PUBLIC',
            },
          },
        },
      })
      if (workspace) {
        return { status: 201, data: 'Workspace Created' }
      }
    }
    return {
      status: 401,
      data: 'You are not authorized to create a workspace.',
    }
  } catch (error) {
    return { status: 400 }
  }
}

export const renameFolders = async (folderId: string, name: string) => {
  try {
    const folder = await client.folder.update({
      where: {
        id: folderId,
      },
      data: {
        name,
      },
    })
    if (folder) {
      return { status: 200, data: 'Folder Renamed' }
    }
    return { status: 400, data: 'Folder does not exist' }
  } catch (error) {
    return { status: 500, data: 'Opps! something went wrong' }
  }
}

export const createFolder = async (workspaceId: string) => {
  try {
    const isNewFolder = await client.workSpace.update({
      where: {
        id: workspaceId,
      },
      data: {
        folders: {
          create: { name: 'Untitled' },
        },
      },
    })
    if (isNewFolder) {
      return { status: 200, message: 'New Folder Created' }
    }
  } catch (error) {
    return { status: 500, message: 'Oppse something went wrong' }
  }
}

export const getFolderInfo = async (folderId: string) => {
  try {
    const folder = await client.folder.findUnique({
      where: {
        id: folderId,
      },
      select: {
        name: true,
        _count: {
          select: {
            videos: true,
          },
        },
      },
    })
    if (folder)
      return {
        status: 200,
        data: folder,
      }
    return {
      status: 400,
      data: null,
    }
  } catch (error) {
    return {
      status: 500,
      data: null,
    }
  }
}

export const moveVideoLocation = async (
  videoId: string,
  workSpaceId: string,
  folderId: string
) => {
  try {
    const location = await client.video.update({
      where: {
        id: videoId,
      },
      data: {
        folderId: folderId || null,
        workSpaceId,
      },
    })
    if (location) return { status: 200, data: 'folder changed successfully' }
    return { status: 404, data: 'workspace/folder not found' }
  } catch (error) {
    return { status: 500, data: 'Oops! something went wrong' }
  }
}

export const getPreviewVideo = async (videoId: string) => {
  try {
    const user = await currentUser()
    if (!user?.id) return { status: 404 }
    const video = await client.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        title: true,
        createdAt: true,
        source: true,
        description: true,
        processing: true,
        views: true,
        summery: true,
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
            clerkid: true,
            trial: true,
            subscription: {
              select: {
                plan: true,
              },
            },
          },
        },
      },
    })
    if (video) {
      return {
        status: 200,
        data: video,
        author: user.id === video.User?.clerkid ? true : false,
      }
    }

    return { status: 404 }
  } catch (error) {
    return { status: 400 }
  }
}

export const sendEmailForFirstView = async (videoId: string) => {
  try {
    const user = await currentUser()
    if (!user?.id) return { status: 404 }
    const firstViewSettings = await client.user.findUnique({
      where: { clerkid: user.id },
      select: {
        firstView: true,
      },
    })
    if (!firstViewSettings?.firstView) return

    const video = await client.video.findUnique({
      where: {
        id: videoId,
      },
      select: {
        title: true,
        views: true,
        User: {
          select: {
            email: true,
          },
        },
      },
    })
    if (video && video.views === 0) {
      await client.video.update({
        where: {
          id: videoId,
        },
        data: {
          views: video.views + 1,
        },
      })

      const { transporter, mailOptions } = await sendEmail(
        video.User?.email!,
        'You got a viewer',
        `Your video ${video.title} just got its first viewer`
      )

      transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error.message)
        } else {
          const notification = await client.user.update({
            where: { clerkid: user.id },
            data: {
              notification: {
                create: {
                  content: mailOptions.text,
                },
              },
            },
          })
          if (notification) {
            return { status: 200 }
          }
        }
      })
    }
  } catch (error) {
    console.log(error)
  }
}

export const editVideoInfo = async (
  videoId: string,
  title: string,
  description: string
) => {
  try {
    // First get the current video data
    const currentVideo = await client.video.findUnique({
      where: { id: videoId },
      select: {
        description: true
      }
    });

    // Check if current description is JSON with aiSummary
    let newDescription = description;
    if (currentVideo?.description) {
      try {
        const parsedData = JSON.parse(currentVideo.description as string);
        if (parsedData.aiSummary) {
          // Preserve the AI summary but update the original title/content
          newDescription = JSON.stringify({
            original: title,
            aiSummary: parsedData.aiSummary,
            keywords: parsedData.keywords || []
          });
        }
      } catch (e) {
        // Not JSON, use the new description directly
      }
    }

    const video = await client.video.update({
      where: { id: videoId },
      data: {
        title,
        description: newDescription,
      },
    })
    if (video) return { status: 200, data: 'Video successfully updated' }
    return { status: 404, data: 'Video not found' }
  } catch (error) {
    return { status: 400 }
  }
}

export const getWixContent = async () => {
  try {
    const myWixClient = createClient({
      modules: { items },
      auth: OAuthStrategy({
        clientId: process.env.WIX_OAUTH_KEY as string,
      }),
    })

    const videos = await myWixClient.items
      .query('opal-videos')
      .find()

    const videoIds = videos.items.map((v) => v.data?.title)

    const video = await client.video.findMany({
      where: {
        id: {
          in: videoIds,
        },
      },
      select: {
        id: true,
        createdAt: true,
        title: true,
        source: true,
        processing: true,
        workSpaceId: true,
        User: {
          select: {
            firstname: true,
            lastname: true,
            image: true,
          },
        },
        Folder: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (video && video.length > 0) {
      return { status: 200, data: video }
    }
    return { status: 404 }
  } catch (error) {
    console.log(error)
    return { status: 400 }
  }
}

export const howToPost = async () => {
  try {
    const response = await axios.get(process.env.CLOUD_WAYS_POST as string)
    if (response.data) {
      return {
        title: response.data[0].title.rendered,
        content: response.data[0].content.rendered,
      }
    }
  } catch (error) {
    return { status: 400 }
  }
}

export const generateVideoSummary = async (videoId: string) => {
  try {
    // Check if user is authenticated and has PRO plan
    const user = await currentUser();
    if (!user?.id) return { status: 403, message: "Unauthorized" };

    const userSubscription = await client.user.findUnique({
      where: { clerkid: user.id },
      select: { subscription: { select: { plan: true } } }
    });

    if (userSubscription?.subscription?.plan !== 'PRO') {
      return { status: 403, message: "This feature is only available for PRO users" };
    }

    // Get the video with transcript
    const video = await client.video.findUnique({
      where: { id: videoId },
      select: { 
        summery: true,
        title: true,
        id: true 
      }
    });

    if (!video) return { status: 404, message: "Video not found" };
    if (!video.summery) return { status: 400, message: "No transcript available for this video" };

    // Call OpenAI to generate educational summary
    const openai = new OpenAI({
      apiKey: process.env.OPEN_AI_KEY,
      baseURL: 'https://api.groq.com/openai/v1', // replace with actual Grok base URL
    });

    const educationalSummary = await openai.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: `You are an educational content summarizer. Create a structured summary with key concepts, definitions, and important points that would help a student understand this material.
          
Format your response in a clear, organized structure:
1. Start with a brief overview of the content
2. Use sections with clear headings like "**Key Concepts:**", "**Important Definitions:**", "**Main Points:**", etc.
3. Use bullet points (with * symbol) for each item within a section
4. Provide a concise conclusion

DO NOT ask for more information or state that no transcript was provided. Work with the transcript provided, even if it seems incomplete.`,
        },
        {
          role: "user",
          content: `Summarize this educational lecture transcript for a learning management system: ${video.summery}`
        }
      ],
    });

    if (!educationalSummary.choices[0].message.content) {
      return { status: 500, message: "Failed to generate summary" };
    }

    // Extract keywords 
    const summary = educationalSummary.choices[0].message.content;
    const keywords = summary
      .split(/\n|\*/)
      .filter(line => line.trim().length > 0)
      .slice(0, 10)
      .map((keyword: string) => keyword.trim());

    // Update the video with the summary
    const updatedVideo = await client.video.update({
      where: { id: videoId },
      data: {
        // Store the summary in JSON format
        description: JSON.stringify({
          original: video.title,
          aiSummary: summary,
          keywords
        })
      }
    });

    return { 
      status: 200, 
      data: {
        summary,
        keywords
      }
    };
  } catch (error) {
    console.error("Error generating video summary:", error);
    return { status: 500, message: "Failed to generate summary" };
  }
}
