import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Server,
  FileCode,
  Play,
  Users,
  Shield,
  BarChart3,
} from "lucide-react";

const tiles = [
  {
    title: "Playbook Management",
    description: "Organize and manage your Ansible playbooks in one place.",
    icon: FileCode,
  },
  {
    title: "Visual Execution",
    description: "Visualize playbook structure and execution flow on a canvas.",
    icon: Play,
  },
  {
    title: "Inventory Sources",
    description: "Connect to Git repositories and manage inventory files.",
    icon: Server,
  },
  {
    title: "Team Workspaces",
    description: "Collaborate with your team using shared workspaces.",
    icon: Users,
  },
  {
    title: "Role-Based Access",
    description: "Control who can view, edit, and execute playbooks.",
    icon: Shield,
  },
  {
    title: "Execution Logs",
    description: "Monitor and review playbook execution results in real time.",
    icon: BarChart3,
  },
];

export const Home = () => {
  return (
    <div className="flex flex-col items-center px-6 py-16">
      <div className="max-w-4xl w-full text-center mb-12">
        <h1 className="text-5xl font-bold text-foreground mb-4">
          Welcome to A-Station
        </h1>
        <p className="text-lg text-muted-foreground">
          A visual platform for managing and executing Ansible playbooks.
        </p>
      </div>

      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tiles.map((tile) => (
          <Card
            key={tile.title}
            className="hover:border-primary transition-colors"
          >
            <CardHeader>
              <tile.icon className="size-8 text-primary mb-2" />
              <CardTitle>{tile.title}</CardTitle>
              <CardDescription>{tile.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};
