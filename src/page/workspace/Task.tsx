
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlarmClock,
  ArrowUp,
  AtSign,
  Bold,
  ChevronsRight,
  Clock,
  Italic,
  Link,
  Paperclip,
  Plus,
  Send,
  Smile,
  User,
  X,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { TimeLogDialog } from "@/components/workspace/time/TimeLogDialog";

import { UserPopover } from "@/components/workspace/common/user-popover";
import { RichTextEditor } from "@/components/RichTextEditor";
import { cn } from "@/lib/utils";

// --- DUMMY DATA AND TYPES ---

interface User {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface Comment {
  id: string;
  author: User;
  createdAt: Date;
  content: string;
}

interface Attachment {

  id: string;

  name: string;

  url: string;

  type: "image" | "pdf" | "zip";

}



interface TimeLog {

  id: string;

  user: User;

  date: Date;

  time: string;

  title: string;

  details?: string;

}



interface Task {

  id: string;

  title: string;

  status: "Backlog" | "To Do" | "In Progress" | "Done" | "Cancelled";

  priority: "Low" | "Medium" | "High" | "Urgent";

  description: string;

  assignee: User;

  reporter: User;

  participants: User[];

  attachments: Attachment[];

  createdAt: Date;

  updatedAt: Date;

  dueDate: Date;

  sla: {

    breached: boolean;

    timeRemaining: string;

  };

  timeLog: {

    logged: string;

    remaining: string;

  };

}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  thumbnailUrl?: string;
}

interface RichTextEditorRef {
  getContent: () => string;
  setContent: (html: string) => void;
  clear: () => void;
  focus: () => void;
  getFiles: () => UploadedFile[];
}





const users: User[] = [

  { id: "user-1", name: "Ankush Gupta", avatarUrl: "https://github.com/ankushgupta.png" },

  { id: "user-2", name: "Jane Doe", avatarUrl: "https://github.com/shadcn.png" },

  { id: "user-3", name: "John Smith", avatarUrl: "/placeholder-user.jpg" },

  { id: "user-4", name: "Emily White", avatarUrl: "https://github.com/vercel.png" },

];



const timeLogsData: TimeLog[] = [

  {

    id: "tl-1",

    user: users[0],

    date: new Date(2025, 10, 24),

    time: "3h 30m",

    title: "Component Library Setup",

    details: "Set up the initial component library structure and added basic button and input components.",

  },

  {

    id: "tl-2",

    user: users[0],

    date: new Date(2025, 10, 25),

    time: "5h 0m",

    title: "Dark Mode Theme Implementation",

    details: "Implemented the main color palette and theme switching logic for dark mode.",

  },

];



const taskData: Task = {
  id: "TQS-123",
  title: "Implement Dark Mode for Dashboard",
  status: "In Progress",
  priority: "High",
  description: `
    <p>As a user, I want to be able to switch to a dark mode theme on the dashboard to reduce eye strain during night-time use.</p>
    <br/>
    <strong>Acceptance Criteria:</strong>
    <ul>
      <li>- A toggle switch should be present in the user settings menu.</li>
      <li>- All components, charts, and text must be legible in dark mode.</li>
      <li>- The selected theme should persist across sessions.</li>
    </ul>
    `,
  assignee: users[0],
  reporter: users[1],
  participants: [users[2], users[3]],
  attachments: [
    { id: "att-1", name: "dark-mode-mockup.png", url: "#", type: "image" },
    { id: "att-2", name: "style-guide.pdf", url: "#", type: "pdf" },
  ],
  createdAt: new Date(2025, 10, 20),
  updatedAt: new Date(2025, 10, 24),
  dueDate: new Date(2025, 11, 5),
  sla: {
    breached: false,
    timeRemaining: "3 days 4 hours",
  },
  timeLog: {
    logged: "8h 30m",
    remaining: "11h 30m",
  },
};

const commentsData: Comment[] = [
  {
    id: "comment-1",
    author: users[1],
    createdAt: new Date(2025, 10, 21),
    content: "Here are the initial mockups. Let me know what you think!",
  },
  {
    id: "comment-2",
    author: users[0],
    createdAt: new Date(2025, 10, 22),
    content: "Thanks, @Jane Doe! The mockups look great. I'll start working on the component library updates.",
  },
  {
    id: "comment-3",
    author: users[2],
    createdAt: new Date(2025, 10, 23),
    content: "I've reviewed the style guide and it's approved. Good to go.",
  },
];

// --- SUB-COMPONENTS ---

const PriorityIcon = ({ priority }: { priority: Task["priority"] }) => {
  switch (priority) {
    case "Urgent":
      return <ArrowUp className="h-4 w-4 text-red-500" />;
    case "High":
      return <ArrowUp className="h-4 w-4 text-orange-500" />;
    case "Medium":
      return <ChevronsRight className="h-4 w-4 text-yellow-500" />;
    case "Low":
    default:
      return <ArrowUp className="h-4 w-4 text-green-500 rotate-180" />;
  }
};

const TaskPage = () => {
  const [isTimeLogDialogOpen, setIsTimeLogDialogOpen] = useState(false);
  const [task, setTask] = useState(taskData);


  const handleSelectParticipant = (userId: string) => {
    const userToAdd = users.find(u => u.id === userId);
    if (userToAdd && !task.participants.find(p => p.id === userId)) {
      setTask(prevTask => ({
        ...prevTask,
        participants: [...prevTask.participants, userToAdd]
      }));
    }
  };

  const handleRemoveParticipant = (userId: string) => {
    setTask(prevTask => ({
      ...prevTask,
      participants: prevTask.participants.filter(p => p.id !== userId)
    }));
  };

  const editorRef = useRef<RichTextEditorRef>(null);


  function Preview({ html }: { html: string }) {
    return (
      <div
        className={html.length > 0 ? cn(
          'prose prose-sm max-w-none p-6 outline-none',
          'overflow-y-auto',
          '[&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:mb-4 [&_h1]:mt-6',
          '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h2]:mt-5',
          '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mb-2 [&_h3]:mt-4',
          '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
          '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2',
          '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2',
          '[&_li]:my-1',
          '[&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-sm [&_pre]:my-2 [&_pre]:overflow-x-auto',
          '[&_code]:bg-muted [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm',
          '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
          'focus:outline-none'
        ) : 'none'}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

 function getCommentAndFiles(){
   // Get HTML content
  const html = editorRef.current?.getContent();

  // Get files
  const files = editorRef.current?.getFiles();
  
  console.log("Comment HTML:", html);
  console.log("Uploaded Files:", files);
 }

  return (
    <TooltipProvider>
      <div className="bg-white text-gray-900 min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <main className="lg:col-span-2 space-y-6">
            {/* Header */}
            <div>
              <span className="text-sm text-gray-500 hover:text-blue-600 cursor-pointer">Projects / Tiqueon / {task.id}</span>
              <h1 className="text-3xl font-bold mt-1">{task.title}</h1>
            </div>

            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: task.description }}
                />
              </CardContent>
            </Card>

            {/* Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments ({task.attachments.length})</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {task.attachments.map((att) => (
                  <div key={att.id} className="border rounded-lg p-2 text-center text-sm space-y-1">
                    <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center">
                      <Paperclip className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="truncate">{att.name}</p>
                    <Button variant="link" size="sm" className="h-auto p-0">Download</Button>
                  </div>
                ))}
                <div className="border rounded-lg p-2 text-center text-sm space-y-1 flex items-center justify-center border-dashed">
                  <Button variant="ghost" className="w-full h-full">
                    <Plus className="h-6 w-6 text-gray-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Time Log List */}
            <Card>
              <CardHeader>
                <CardTitle>Time Logs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeLogsData.map((log) => (
                  <div key={log.id} className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={log.user.avatarUrl} alt={log.user.name} />
                      <AvatarFallback>{log.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">{log.user.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            logged time on {format(log.date, "MMM d, yyyy")}
                          </span>
                        </div>
                        <span className="font-bold text-lg">{log.time}</span>
                      </div>
                      <div className="mt-2">
                        <p className="font-semibold">{log.title}</p>
                        {log.details && <p className="text-sm text-gray-600">{log.details}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Comment Section */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Activity</h2>
              {/* New Comment Form */}
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={users[0].avatarUrl} alt={users[0].name} />
                  <AvatarFallback>{users[0].name.charAt(0)}</AvatarFallback>
                </Avatar>
                <RichTextEditor
                  placeholder="Start writing your content here... Try @mentioning users, uploading files, or formatting your text!"
                  minHeight={400}
                  maxHeight={600}
                  ref={editorRef}
                />
              </div>
              {/* send button */}
              <div className="flex justify-end mt-4">
                <Button onClick={getCommentAndFiles} disabled={false} >
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>

              {/* Existing Comments */}
              <div className="space-y-6 my-6">
                {commentsData.map((comment) => (
                  <div key={comment.id} className="flex items-start space-x-4">
                    <Avatar>
                      <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                      <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{comment.author.name}</span>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="mt-1">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Status */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <Select defaultValue={task.status}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Backlog">Backlog</SelectItem>
                      <SelectItem value="To Do">To Do</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Done">Done</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                {/* Assignee */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Assignee</span>
                  <Select value={task.assignee.id} onValueChange={(userId) => {
                    const newAssignee = users.find(u => u.id === userId);
                    if (newAssignee) {
                      setTask(prevTask => ({ ...prevTask, assignee: newAssignee }));
                    }
                  }}>
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                          <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <SelectValue>
                          <span>{task.assignee.name}</span>
                        </SelectValue>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatarUrl} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span>{user.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                {/* Reporter */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Reporter</span>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={task.reporter.avatarUrl} alt={task.reporter.name} />
                      <AvatarFallback>{task.reporter.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{task.reporter.name}</span>
                  </div>
                </div>
                <Separator />
                {/* Priority */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Priority</span>
                  <Select defaultValue={task.priority}>
                    <SelectTrigger className="w-[150px]">
                      <div className="flex items-center gap-2">
                        <PriorityIcon priority={task.priority} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Urgent">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="Urgent" /> Urgent
                        </div>
                      </SelectItem>
                      <SelectItem value="High">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="High" /> High
                        </div>
                      </SelectItem>
                      <SelectItem value="Medium">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="Medium" /> Medium
                        </div>
                      </SelectItem>
                      <SelectItem value="Low">
                        <div className="flex items-center gap-2">
                          <PriorityIcon priority="Low" /> Low
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">People</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Participants */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Participants</span>
                    <UserPopover users={users} onSelect={handleSelectParticipant}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </UserPopover>
                  </div>
                  <div className="flex items-center space-x-2 flex-wrap">
                    {task.participants.map(p => (
                      <Tooltip key={p.id}>
                        <TooltipTrigger>
                          <div className="relative group">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={p.avatarUrl} alt={p.name} />
                              <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <button
                              onClick={() => handleRemoveParticipant(p.id)}
                              className="absolute top-0 right-0 -mt-1 -mr-1 bg-gray-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>{p.name}</TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Created</span>
                  <span>{format(task.createdAt, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Updated</span>
                  <span>{formatDistanceToNow(task.updatedAt, { addSuffix: true })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Due Date</span>
                  <span>{format(task.dueDate, "MMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Time Tracking</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setIsTimeLogDialogOpen(true)}>Log Time</Button>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span>Logged: {task.timeLog.logged}</span>
                  <span className="text-gray-500">Remaining: {task.timeLog.remaining}</span>
                </div>
              </CardContent>
            </Card>

            <Card className={task.sla.breached ? 'border-red-500' : 'border-green-500'}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">SLA</span>
                  <div className={`flex items-center space-x-2 ${task.sla.breached ? 'text-red-500' : 'text-green-500'}`}>
                    <AlarmClock className="h-5 w-5" />
                    <span>{task.sla.breached ? "Breached" : task.sla.timeRemaining}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </aside>
        </div>
      </div>
      <TimeLogDialog isOpen={isTimeLogDialogOpen} onClose={() => setIsTimeLogDialogOpen(false)} />
    </TooltipProvider>
  );
};

export default TaskPage;
