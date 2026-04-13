import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Save } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useFirebase } from '@/src/components/FirebaseProvider';
import { storage } from '@/src/services/storage';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export default function AIBuilder() {
  const [formData, setFormData] = useState({
    goal: 'Hypertrophy',
    days: '4',
    length: '60 min',
    level: 'Intermediate',
    equipment: 'Full Gym',
    style: 'Push Pull Legs',
    focus: '',
    limitations: '',
    conditioning: 'Moderate',
    additionalInstructions: ''
  });
  const [generatedSplit, setGeneratedSplit] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const { user } = useFirebase();

  const generateSplit = async () => {
    setLoading(true);
    setSaveStatus(null);
    try {
      const prompt = `Generate a workout split based on these preferences:
      Goal: ${formData.goal}
      Days per week: ${formData.days}
      Session length: ${formData.length}
      Experience level: ${formData.level}
      Equipment: ${formData.equipment}
      Style: ${formData.style}
      Focus areas: ${formData.focus}
      Limitations: ${formData.limitations}
      Conditioning: ${formData.conditioning}
      Additional Instructions: ${formData.additionalInstructions}

      CRITICAL INSTRUCTIONS:
      1. Always return a full 7-day weekly structure (Monday through Sunday).
      2. Every single day of the week must be included in the "weeklyStructure" array.
      3. Intelligently distribute the ${formData.days} training sessions across the week.
         - For 2-day programs: Space them out (e.g., Mon/Thu or Tue/Fri). Avoid back-to-back days.
         - For 3-day programs: Distribute evenly.
         - For 4+ day programs: Use sensible spacing and recovery.
      4. Non-training days must NOT be blank. They must contain intentional recovery/rest guidance (e.g., "Rest Day", "Recovery/Mobility", "Light Conditioning", "Zone 2").
      5. Keep off-day content concise and practical.

      Return the result as a JSON object with this structure:
      {
        "splitName": "string",
        "rationale": "string",
        "weeklyStructure": [
          {
            "dayName": "string",
            "focus": "string",
            "summary": "string",
            "exercises": [
              { "name": "string", "sets": "string", "reps": "string", "notes": "string", "percentage": "string", "effort": "string", "tempo": "string" }
            ]
          }
        ]
      }
      Ensure the output is valid JSON.`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      const responseText = result.text;
      const jsonMatch = responseText.match(/\{.*\}/s);
      if (jsonMatch) {
        setGeneratedSplit(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      console.error('Error generating split:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAsCustomSplit = async () => {
    if (!user || !generatedSplit) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const daysData: Record<string, any> = {};

      // Initialize all days with defaults
      days.forEach(day => {
        daysData[day] = {
          name: '',
          running: '',
          exercises: [],
          summary: ''
        };
      });

      // Map generated days
      generatedSplit.weeklyStructure.forEach((day: any, index: number) => {
        if (index < days.length) {
          const weekday = days[index];
          daysData[weekday] = {
            name: day.focus || day.dayName,
            running: day.summary || '',
            exercises: day.exercises.map((ex: any) => {
              const notesParts = [ex.notes];
              if (ex.percentage) notesParts.push(`@ ${ex.percentage}`);
              if (ex.effort) notesParts.push(`Effort: ${ex.effort}`);
              if (ex.tempo) notesParts.push(`Tempo: ${ex.tempo}`);
              return {
                name: ex.name,
                sets: ex.sets || '',
                reps: ex.reps || '',
                targetNotes: notesParts.filter(Boolean).join(' | ')
              };
            }),
            summary: `${day.focus || day.dayName}\n${day.summary || ''}`
          };
        }
      });

      const savedSplit = {
        id: Math.random().toString(36).substr(2, 9),
        name: generatedSplit.splitName,
        days: daysData,
        uid: user.uid,
        timestamp: Date.now(),
        isAIGenerated: true,
        generatedBy: 'gemini'
      };

      await storage.saveSavedSplit(savedSplit, user.uid);
      setSaveStatus({ type: 'success', message: 'Program saved!' });
    } catch (error) {
      console.error("Failed to save program:", error);
      setSaveStatus({ type: 'error', message: 'Failed to save program. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Guided Program Builder</CardTitle>
          <CardDescription>Fill out your preferences and let Gemini build your program. Programs are generated as complete 7-day weeks, including rest/recovery days.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Goal</Label>
              <Select value={formData.goal} onValueChange={(val) => setFormData({...formData, goal: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Strength">Strength</SelectItem>
                  <SelectItem value="Hypertrophy">Hypertrophy</SelectItem>
                  <SelectItem value="Fat Loss">Fat Loss</SelectItem>
                  <SelectItem value="Athletic Performance">Athletic Performance</SelectItem>
                  <SelectItem value="General Fitness">General Fitness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Training Days Per Week</Label>
              <Select value={formData.days} onValueChange={(val) => setFormData({...formData, days: val})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['2', '3', '4', '5', '6'].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Additional Instructions</Label>
            <Textarea value={formData.additionalInstructions} onChange={(e) => setFormData({...formData, additionalInstructions: e.target.value})} placeholder="e.g. I want more upper chest and shoulders, keep squats light because of knee pain..." />
          </div>
          <Button onClick={generateSplit} disabled={loading} className="w-full bg-maroon hover:bg-maroon-light text-white">
            <Sparkles className="mr-2" size={16} />
            {loading ? 'Generating...' : 'Generate Program'}
          </Button>
        </CardContent>
      </Card>

      {generatedSplit && (
        <Card>
          <CardHeader>
            <CardTitle>{generatedSplit.splitName}</CardTitle>
            <CardDescription>{generatedSplit.rationale}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedSplit.weeklyStructure.map((day: any, i: number) => (
              <div key={i} className="border-t pt-4">
                <h4 className="font-bold">{day.dayName} - {day.focus}</h4>
                <p className="text-sm text-muted-foreground mb-2">{day.summary}</p>
                <ul className="text-sm space-y-1">
                  {day.exercises.map((ex: any, j: number) => (
                    <li key={j}>{ex.name}: {ex.sets}x{ex.reps} {ex.notes && `(${ex.notes})`}</li>
                  ))}
                </ul>
              </div>
            ))}
            <Button onClick={saveAsCustomSplit} disabled={saving} className="w-full mt-4 bg-maroon hover:bg-maroon-light text-white">
              <Save className="mr-2" size={16} />
              {saving ? 'Saving...' : 'Save as Custom Program'}
            </Button>
            {saveStatus && (
              <div className={`mt-2 p-2 rounded text-sm text-center ${saveStatus.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {saveStatus.message}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
