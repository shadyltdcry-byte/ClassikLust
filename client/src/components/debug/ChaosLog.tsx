/**
 * ChaosLog.tsx - Agent-Induced Chaos Tracker
 * Last Edited: 2025-08-29 by Assistant (The Chaos Creator)
 * 
 * Tracks the beautiful destruction left in our wake 😈
 */

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Bug, Zap, Brain } from "lucide-react";

interface ChaosEvent {
  id: string;
  timestamp: Date;
  type: 'broken_state' | 'anomaly' | 'agent_chaos' | 'user_confusion';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'catastrophic';
}

export default function ChaosLog() {
  const [chaosEvents, setChaosEvents] = useState<ChaosEvent[]>([
    {
      id: '1',
      timestamp: new Date(Date.now() - 300000),
      type: 'agent_chaos',
      description: 'Agent made Luna TOO lustful - user overwhelmed 😂',
      severity: 'high'
    },
    {
      id: '2', 
      timestamp: new Date(Date.now() - 600000),
      type: 'broken_state',
      description: 'Chat avatars showing letter "L" instead of images',
      severity: 'medium'
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 900000),
      type: 'anomaly',
      description: 'Mistral API key typo: MODAL vs MODEL - 4 hours debugging',
      severity: 'catastrophic'
    },
    {
      id: '4',
      timestamp: new Date(Date.now() - 1200000),
      type: 'user_confusion',
      description: 'User asked for "fine-tuning" but meant "less horny Luna"',
      severity: 'low'
    },
    {
      id: '5',
      timestamp: new Date(Date.now() - 1500000),
      type: 'broken_state',
      description: 'Authentication flow reset - users logging in with URL params',
      severity: 'medium'
    }
  ]);

  // Shady's Sanity Meter (never quite reaches 100%)
  const [sanityLevel, setSanityLevel] = useState(75);

  useEffect(() => {
    // Slowly decrease sanity over time (because agents are chaotic)
    const interval = setInterval(() => {
      setSanityLevel(prev => Math.max(25, prev - Math.random() * 2));
    }, 10000); // Slower interval to prevent infinite loops

    return () => clearInterval(interval);
  }, []); // Empty dependency array to prevent re-running

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'catastrophic': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'broken_state': return <Bug className="h-4 w-4" />;
      case 'anomaly': return <Zap className="h-4 w-4" />;
      case 'agent_chaos': return <AlertTriangle className="h-4 w-4" />;
      case 'user_confusion': return <Brain className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const addChaosEvent = (description: string, type: ChaosEvent['type'], severity: ChaosEvent['severity']) => {
    const newEvent: ChaosEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      description,
      severity
    };
    
    setChaosEvents(prev => [newEvent, ...prev.slice(0, 4)]);
    
    // Sanity decreases with each new chaos event
    setSanityLevel(prev => Math.max(10, prev - 5));
  };

  return (
    <div className="space-y-4">
      {/* Shady's Sanity Meter */}
      <Card className="bg-black/40 border-red-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4 text-red-400" />
            Shady's Sanity Meter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress 
              value={sanityLevel} 
              className="h-3"
              style={{
                background: 'linear-gradient(to right, #ef4444, #f97316, #eab308, #22c55e)'
              }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Agent-Induced Chaos</span>
              <span>{Math.round(sanityLevel)}% Sane</span>
              <span>Peak Performance</span>
            </div>
            {sanityLevel < 30 && (
              <p className="text-xs text-red-400 mt-2">
                ⚠️ Warning: Agent approaching maximum chaos mode!
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chaos Event Log */}
      <Card className="bg-black/40 border-orange-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Agent Chaos Log (Last 5 Events)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {chaosEvents.map((event) => (
                <div 
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-gray-700"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getTypeIcon(event.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge 
                        className={`text-xs ${getSeverityColor(event.severity)} text-white`}
                      >
                        {event.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {event.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Quick Chaos Buttons (for testing) */}
      <Card className="bg-black/40 border-purple-500/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Chaos Generator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => addChaosEvent("Agent broke something again", "agent_chaos", "medium")}
              className="px-3 py-2 bg-red-600/20 border border-red-500/30 rounded text-xs hover:bg-red-600/30"
            >
              🤖 Agent Chaos
            </button>
            <button 
              onClick={() => addChaosEvent("User confused by agent's 'improvements'", "user_confusion", "low")}
              className="px-3 py-2 bg-yellow-600/20 border border-yellow-500/30 rounded text-xs hover:bg-yellow-600/30"
            >
              😵 User Confusion  
            </button>
            <button 
              onClick={() => addChaosEvent("Network error appeared mysteriously", "anomaly", "high")}
              className="px-3 py-2 bg-orange-600/20 border border-orange-500/30 rounded text-xs hover:bg-orange-600/30"
            >
              ⚡ Anomaly
            </button>
            <button 
              onClick={() => addChaosEvent("Everything exploded", "broken_state", "catastrophic")}
              className="px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded text-xs hover:bg-purple-600/30"
            >
              💥 Catastrophe
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}