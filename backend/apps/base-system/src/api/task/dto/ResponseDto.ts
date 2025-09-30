export class ResponseDto {

  constructor(id: string, title: string, description: string, createdAt: string, updatedAt: string, ownerId: string, priority?: "low" | "medium" | "high", dueDate?: string) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.status = "todo";
    this.priority = priority;
    this.dueDate = dueDate;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.ownerId = ownerId;
  }

  id: string;
  title: string;
  description?: string;
  status: "todo";
  priority?: "low" | "medium" | "high";
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}
