export interface PlaybookCreate {
  name: string;
  yaml_content: string;
}

export interface PlaybookRead {
  id: string;
  name: string;
  yaml_content: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

export interface PlaybookUpdate {
  name?: string;
  yaml_content?: string;
}