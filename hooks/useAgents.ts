import { useState, useEffect } from 'react';
import { AgentInstance, Task, Rule, Skill } from '../types';

export const useAgents = () => {
  const [agents, setAgents] = useState<AgentInstance[]>(() => {
    const saved = localStorage.getItem('cline_agents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((a: AgentInstance) => ({ ...a, status: 'online' }));
      } catch (e) {
        console.error("Failed to load agents", e);
      }
    }
    return [];
  });

  const [activeAgentId, setActiveAgentId] = useState<string>(() => {
    return localStorage.getItem('cline_active_agent_id') || '';
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('cline_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [rules, setRules] = useState<Rule[]>(() => {
    const saved = localStorage.getItem('cline_rules');
    return saved ? JSON.parse(saved) : [
      { id: 'r1', content: 'Always use TypeScript for new files.', enabled: true },
      { id: 'r2', content: 'Prefix git commits with chore:, feat: or fix:.', enabled: false },
      { id: 'r3', content: 'Explain code changes before writing them.', enabled: true }
    ];
  });

  const [skills, setSkills] = useState<Skill[]>(() => {
    const saved = localStorage.getItem('cline_skills');
    return saved ? JSON.parse(saved) : [
      { id: 's1', name: 'Web Scraping', description: 'Advanced DOM extraction.', enabled: true },
      { id: 's2', name: 'Docker Orchestrator', description: 'Manage local containers.', enabled: false },
      { id: 's3', name: 'Unit Test Suite', description: 'Auto-generate Vitest suites.', enabled: true }
    ];
  });

  useEffect(() => {
    localStorage.setItem('cline_agents', JSON.stringify(agents));
  }, [agents]);

  useEffect(() => {
    localStorage.setItem('cline_active_agent_id', activeAgentId);
  }, [activeAgentId]);

  useEffect(() => {
    localStorage.setItem('cline_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('cline_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('cline_skills', JSON.stringify(skills));
  }, [skills]);

  return {
    agents,
    setAgents,
    activeAgentId,
    setActiveAgentId,
    tasks,
    setTasks,
    rules,
    setRules,
    skills,
    setSkills,
  };
};
