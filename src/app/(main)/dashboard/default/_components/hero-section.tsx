"use client";

import React, { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { ArrowUp, Volume2, FileText, Check, ChevronsUpDown, RotateCcw, X, Save, ChevronDown, ChevronUp, Link, FileAudio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { scriptTemplates, getCategoryDisplayName, type ScriptTemplate } from "@/data/script-templates";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  className?: string;
}

// Voice options for the ComboBox
const voices = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "conversational", label: "Conversational" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "educational", label: "Educational" },
  { value: "persuasive", label: "Persuasive" },
];

export function HeroSection({ className }: HeroSectionProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [placeholder, setPlaceholder] = useState("");
  const [selectedVoices, setSelectedVoices] = useState<string[]>(voices.map(v => v.value)); // All voices pre-selected
  const [voiceComboOpen, setVoiceComboOpen] = useState(false);
  const [scriptBuilderOpen, setScriptBuilderOpen] = useState(false);
  const [assembledScript, setAssembledScript] = useState<string>("");
  const [savedTemplates, setSavedTemplates] = useState<{ name: string; content: string }[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<Record<string, ScriptTemplate>>({});
  const [customScriptTemplate, setCustomScriptTemplate] = useState<string>("");
  const [isUsingCustomScript, setIsUsingCustomScript] = useState<boolean>(false);
  
  // Adapt from content states
  const [adaptFromUrlOpen, setAdaptFromUrlOpen] = useState<boolean>(false);
  const [adaptFromTranscriptOpen, setAdaptFromTranscriptOpen] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>("");
  const [transcriptInput, setTranscriptInput] = useState<string>("");
  const [isProcessingUrl, setIsProcessingUrl] = useState<boolean>(false);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState<boolean>(false);
  const [adaptedContent, setAdaptedContent] = useState<{
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  } | null>(null);

  const fullPlaceholder = isUsingCustomScript 
    ? "Describe your script idea and I'll use your custom template to create compelling content..."
    : "What would you like to create today? Describe your content idea, topic, or let me know what you're working on...";

  // Typewriter effect for placeholder
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    setPlaceholder(""); // Reset placeholder when it changes

    const typeWriter = () => {
      if (currentIndex < fullPlaceholder.length) {
        setPlaceholder(fullPlaceholder.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeWriter, 30);
      }
    };

    typeWriter();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [fullPlaceholder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue) {
      let encodedPrompt = encodeURIComponent(trimmedValue);
      
      // If using custom script template, append it to the URL
      if (isUsingCustomScript && customScriptTemplate) {
        const encodedTemplate = encodeURIComponent(customScriptTemplate);
        encodedPrompt += `&template=${encodedTemplate}`;
      }
      
      router.push(`/dashboard/scripts/editor/new?prompt=${encodedPrompt}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleVoice = (voiceValue: string) => {
    setSelectedVoices(prev => 
      prev.includes(voiceValue) 
        ? prev.filter(v => v !== voiceValue)
        : [...prev, voiceValue]
    );
  };

  const addTemplateToScript = (template: ScriptTemplate) => {
    // Update selected templates (one per category)
    setSelectedTemplates(prev => ({
      ...prev,
      [template.category]: template
    }));
    
    // Rebuild the script from selected templates in order
    const updatedTemplates = {
      ...selectedTemplates,
      [template.category]: template
    };
    
    // Build script in category order: hooks, bridges, nuggets, wtas
    const orderedCategories = ['hooks', 'bridges', 'nuggets', 'wtas'];
    const scriptParts = orderedCategories
      .filter(category => updatedTemplates[category])
      .map(category => updatedTemplates[category].content);
    
    setAssembledScript(scriptParts.join('\n\n'));
  };

  const clearScript = () => {
    setAssembledScript("");
    setSelectedTemplates({});
  };

  const clearCustomScript = () => {
    setCustomScriptTemplate("");
    setIsUsingCustomScript(false);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsProcessingUrl(true);
    try {
      // Call API to process URL and extract content
      const response = await fetch('/api/scriptwriting/extract-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'url',
          content: urlInput.trim()
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdaptedContent(data);
        setUrlInput("");
        setAdaptFromUrlOpen(false);
      } else {
        console.error('Failed to process URL');
      }
    } catch (error) {
      console.error('Error processing URL:', error);
    } finally {
      setIsProcessingUrl(false);
    }
  };

  const handleTranscriptSubmit = async () => {
    if (!transcriptInput.trim()) return;
    
    setIsProcessingTranscript(true);
    try {
      // Call API to process transcript and extract components
      const response = await fetch('/api/scriptwriting/extract-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'transcript',
          content: transcriptInput.trim()
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdaptedContent(data);
        setTranscriptInput("");
        setAdaptFromTranscriptOpen(false);
      } else {
        console.error('Failed to process transcript');
      }
    } catch (error) {
      console.error('Error processing transcript:', error);
    } finally {
      setIsProcessingTranscript(false);
    }
  };

  const useAdaptedContent = () => {
    if (adaptedContent) {
      const scriptContent = [
        adaptedContent.hook,
        adaptedContent.bridge,
        adaptedContent.nugget,
        adaptedContent.wta
      ].filter(Boolean).join('\n\n');
      
      setAssembledScript(scriptContent);
      setAdaptedContent(null);
    }
  };

  const saveAdaptedAsTemplate = () => {
    if (adaptedContent) {
      const scriptContent = [
        adaptedContent.hook,
        adaptedContent.bridge,
        adaptedContent.nugget,
        adaptedContent.wta
      ].filter(Boolean).join('\n\n');
      
      const templateName = `Adapted Template ${savedTemplates.length + 1}`;
      setSavedTemplates(prev => [...prev, { name: templateName, content: scriptContent }]);
      setAdaptedContent(null);
    }
  };

  const saveCurrentTemplate = () => {
    if (assembledScript.trim()) {
      const templateName = `Template ${savedTemplates.length + 1}`;
      setSavedTemplates(prev => [...prev, { name: templateName, content: assembledScript }]);
    }
  };

  const loadTemplate = (template: { name: string; content: string }) => {
    setAssembledScript(template.content);
    // Clear selected templates when loading a saved template
    setSelectedTemplates({});
  };

  const submitWithTemplate = () => {
    if (assembledScript.trim()) {
      // Store the template and set custom script mode
      setCustomScriptTemplate(assembledScript);
      setIsUsingCustomScript(true);
      
      // Close the dialog and clear the main input
      setScriptBuilderOpen(false);
      setValue("");
      
      // Focus back on the main input
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Describe your idea"]') as HTMLTextAreaElement;
        if (textarea) {
          textarea.focus();
        }
      }, 100);
    }
  };

  const trimmedValue = value.trim();

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 md:py-20 lg:py-24", className)}>
      {/* Hero Headline */}
      <div className="mb-8 max-w-4xl text-center">
        <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl xl:text-7xl">
          What will You <span className="text-emerald-500 font-black">Script Today</span>?
        </h1>
        <p className="text-muted-foreground text-xl md:text-2xl lg:text-2xl font-medium">
          Describe your idea and I&apos;ll help you create compelling content
        </p>
      </div>

      {/* Custom Script Indicator */}
      {isUsingCustomScript && (
        <div className="mx-auto w-full max-w-2xl mb-4">
          <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Custom Script Template Active</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCustomScript}
              className="h-6 px-2 text-xs text-primary hover:text-primary/80"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Main Input Section */}
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
        <div className="relative">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="focus-visible:ring-primary/50 hover:border-primary/30 min-h-[100px] w-full resize-none border-border px-5 py-4 pr-20 pb-12 text-base transition-colors focus-visible:ring-2 md:min-h-[110px] md:text-lg"
            autoFocus
          />

          {/* Bottom Left Controls */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {/* Voice Engine ComboBox */}
            <Popover open={voiceComboOpen} onOpenChange={setVoiceComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-primary h-7 px-2 text-xs font-medium border border-border/50 hover:border-border"
                >
                  <Volume2 className="h-3 w-3 mr-1.5" />
                  {selectedVoices.length === voices.length ? "All Voices" : `${selectedVoices.length} Selected`}
                  <ChevronsUpDown className="h-3 w-3 ml-1.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search voices..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>No voices found.</CommandEmpty>
                    <CommandGroup>
                      {voices.map((voice) => (
                        <CommandItem
                          key={voice.value}
                          onSelect={() => toggleVoice(voice.value)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedVoices.includes(voice.value) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {voice.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Script Builder Dialog */}
            <Dialog 
              open={scriptBuilderOpen} 
              onOpenChange={(open) => {
                setScriptBuilderOpen(open);
                // When opening the dialog in custom script mode, load the current template
                if (open && isUsingCustomScript && customScriptTemplate && !assembledScript) {
                  setAssembledScript(customScriptTemplate);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "h-7 px-2 text-xs font-medium border border-border/50 hover:border-border",
                    isUsingCustomScript 
                      ? "text-primary border-primary/50 bg-primary/5" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <FileText className="h-3 w-3 mr-1.5" />
                  {isUsingCustomScript ? "Custom Script" : "Script Builder"}
                </Button>
              </DialogTrigger>
              <DialogContent className="!fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 !max-w-6xl !w-11/12 !h-[85vh] !p-0 !z-50 relative bg-white dark:bg-neutral-900 border border-transparent dark:border-neutral-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
                <DialogHeader className="sr-only">
                  <DialogTitle>Script Builder</DialogTitle>
                </DialogHeader>
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 py-3 px-4 bg-neutral-100 dark:bg-neutral-900 rounded-t-2xl">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xs uppercase font-medium text-neutral-700 dark:text-neutral-300">Script Builder</h2>
                    <button 
                      onClick={clearScript}
                      className="text-[10px] text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-md px-2 py-0.5 flex items-center"
                    >
                      <RotateCcw className="w-2 h-2 mr-1 opacity-50" />
                      Clear
                    </button>
                    <button 
                      onClick={saveCurrentTemplate}
                      className="text-[10px] text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-md px-2 py-0.5 flex items-center"
                    >
                      <Save className="w-2 h-2 mr-1 opacity-50" />
                      Save
                    </button>
                  </div>
                  <button 
                    onClick={() => setScriptBuilderOpen(false)}
                    className="flex items-center justify-center text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-full p-1"
                  >
                    
                  </button>
                </div>

                {/* Main Content */}
                <div className="flex flex-col md:flex-row flex-1 h-full overflow-hidden rounded-b-2xl">
                  {/* Left Panel - Template Library */}
                  <div className="w-full md:w-3/4 md:border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto bg-background rounded-bl-2xl">
                    <div className="p-6 space-y-8">
                      {/* Adapt from Content Section */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Adapt from URL */}
                        <div className="border border-border rounded-lg">
                          <button
                            onClick={() => setAdaptFromUrlOpen(!adaptFromUrlOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <Link className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Adapt from URL</span>
                            </div>
                            {adaptFromUrlOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {adaptFromUrlOpen && (
                            <div className="p-4 border-t border-border">
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={urlInput}
                                  onChange={(e) => setUrlInput(e.target.value)}
                                  placeholder="Enter URL to analyze..."
                                  className="flex-1 px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <Button
                                  onClick={handleUrlSubmit}
                                  disabled={!urlInput.trim() || isProcessingUrl}
                                  size="sm"
                                  className="text-xs"
                                >
                                  {isProcessingUrl ? "Processing..." : "Submit"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Adapt from Transcript */}
                        <div className="border border-border rounded-lg">
                          <button
                            onClick={() => setAdaptFromTranscriptOpen(!adaptFromTranscriptOpen)}
                            className="w-full flex items-center justify-between p-4 hover:bg-accent transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              <FileAudio className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">Adapt from Transcript</span>
                            </div>
                            {adaptFromTranscriptOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                          {adaptFromTranscriptOpen && (
                            <div className="p-4 border-t border-border">
                              <div className="space-y-2">
                                <Textarea
                                  value={transcriptInput}
                                  onChange={(e) => setTranscriptInput(e.target.value)}
                                  placeholder="Paste your transcript here..."
                                  className="min-h-[100px] text-sm resize-none"
                                />
                                <div className="flex justify-end">
                                  <Button
                                    onClick={handleTranscriptSubmit}
                                    disabled={!transcriptInput.trim() || isProcessingTranscript}
                                    size="sm"
                                    className="text-xs"
                                  >
                                    {isProcessingTranscript ? "Processing..." : "Submit"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Render each category */}
                      {Object.entries(scriptTemplates).map(([categoryKey, templates]) => (
                        <div key={categoryKey}>
                          <h4 className="text-xs uppercase text-muted-foreground mb-4 font-medium px-1">
                            {getCategoryDisplayName(categoryKey)}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {templates.map((template) => {
                              const isSelected = selectedTemplates[categoryKey]?.id === template.id;
                              return (
                                <div
                                  key={template.id}
                                  onClick={() => addTemplateToScript(template)}
                                  className={cn(
                                    "aspect-square p-4 border rounded-xl cursor-pointer transition-all duration-200 flex items-center justify-center text-center",
                                    isSelected 
                                      ? "border-primary bg-primary/5 shadow-md" 
                                      : "border-border hover:border-primary/50 hover:bg-accent bg-background"
                                  )}
                                >
                                  <p className="text-xs text-foreground leading-relaxed overflow-hidden">
                                    {template.content.length > 120 ? template.content.substring(0, 120) + '...' : template.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Panel - Script Editor */}
                  <div className="w-full md:w-1/4 flex flex-col h-full bg-background rounded-br-2xl">
                    <div className="flex-1 p-4 flex flex-col">
                      {/* Adapted Content Display */}
                      {adaptedContent && (
                        <div className="mb-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                          <h3 className="text-xs font-medium text-primary mb-3">Adapted Content</h3>
                          <div className="space-y-3 text-xs">
                            <div>
                              <div className="font-medium text-primary/80 mb-1">Hook:</div>
                              <div className="text-foreground/80">{adaptedContent.hook}</div>
                            </div>
                            <div>
                              <div className="font-medium text-primary/80 mb-1">Bridge:</div>
                              <div className="text-foreground/80">{adaptedContent.bridge}</div>
                            </div>
                            <div>
                              <div className="font-medium text-primary/80 mb-1">Golden Nugget:</div>
                              <div className="text-foreground/80">{adaptedContent.nugget}</div>
                            </div>
                            <div>
                              <div className="font-medium text-primary/80 mb-1">WTA:</div>
                              <div className="text-foreground/80">{adaptedContent.wta}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button
                              onClick={useAdaptedContent}
                              size="sm"
                              className="text-xs flex-1"
                            >
                              Use Content
                            </Button>
                            <Button
                              onClick={saveAdaptedAsTemplate}
                              variant="outline"
                              size="sm"
                              className="text-xs flex-1"
                            >
                              Save as Template
                            </Button>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col space-y-2 mb-4">
                        <h3 className="text-xs font-medium">Script Assembly</h3>
                        {assembledScript && (
                          <Button
                            onClick={submitWithTemplate}
                            size="sm"
                            className="text-xs w-full"
                          >
                            Submit Script
                          </Button>
                        )}
                      </div>
                      
                      <Textarea
                        value={assembledScript}
                        onChange={(e) => setAssembledScript(e.target.value)}
                        placeholder="Click templates to build your script..."
                        className="flex-1 min-h-[300px] resize-none text-xs leading-relaxed"
                      />
                    </div>
                    
                    {savedTemplates.length > 0 && (
                      <div className="border-t border-neutral-200 dark:border-neutral-800 p-4">
                        <h3 className="text-xs font-medium mb-3">Saved Templates</h3>
                        <div className="space-y-2">
                          {savedTemplates.map((template, index) => (
                            <div 
                              key={index} 
                              onClick={() => loadTemplate(template)}
                              className="p-2 border rounded-lg bg-background hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <div className="font-medium text-xs">{template.name}</div>
                              <div className="text-[10px] text-muted-foreground mt-1 truncate">
                                {template.content.substring(0, 40)}...
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="icon"
            className={cn(
              "absolute bottom-3 right-3 h-[34px] w-[34px] rounded-md border transition-all duration-200 ease-out outline-none",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:ring-offset-1",
              trimmedValue
                ? "bg-primary hover:bg-primary/90 text-primary-foreground border-border"
                : "bg-background hover:bg-accent hover:text-accent-foreground text-foreground border-border"
            )}
            disabled={!trimmedValue}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>

        {trimmedValue && (
          <div className="mt-4 flex justify-center">
            <p className="text-muted-foreground text-sm">
              Press <kbd className="bg-muted rounded px-1.5 py-0.5 text-xs font-medium">⌘ Enter</kbd> to generate
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
