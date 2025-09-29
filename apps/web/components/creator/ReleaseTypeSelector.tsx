
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Info, Disc, Cloud, Package } from 'lucide-react';

interface ReleaseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const RELEASE_TYPE_OPTIONS = [
  {
    value: 'digital',
    label: 'Digital Only',
    icon: Cloud,
    description: 'Digital streaming and downloads only',
    badge: 'Most Popular'
  },
  {
    value: 'physical',
    label: 'Physical Only',
    icon: Disc,
    description: 'Physical media (CD, Vinyl, USB) with unlock codes',
    badge: 'Premium'
  },
  {
    value: 'hybrid',
    label: 'Physical + Digital',
    icon: Package,
    description: 'Both digital release and physical with unlock codes',
    badge: 'Best Value'
  }
];

export function ReleaseTypeSelector({ value, onChange, className = '' }: ReleaseTypeSelectorProps) {
  const [adminSettings, setAdminSettings] = useState({
    physicalEnabled: true,
    hybridEnabled: true
  });

  // Fetch admin settings for release types
  useEffect(() => {
    const fetchAdminSettings = async () => {
      try {
        const response = await fetch('/api/admin/release-modes');
        if (response.ok) {
          const settings = await response.json();
          setAdminSettings(settings);
        }
      } catch (error) {
        console.error('Failed to fetch admin settings:', error);
      }
    };

    fetchAdminSettings();
  }, []);

  const availableOptions = RELEASE_TYPE_OPTIONS.filter(option => {
    if (option.value === 'physical' && !adminSettings.physicalEnabled) return false;
    if (option.value === 'hybrid' && !adminSettings.hybridEnabled) return false;
    return true;
  });

  const selectedOption = RELEASE_TYPE_OPTIONS.find(option => option.value === value);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Release Format
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select release format">
              {selectedOption && (
                <div className="flex items-center gap-2">
                  <selectedOption.icon className="h-4 w-4" />
                  <span>{selectedOption.label}</span>
                  {selectedOption.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedOption.badge}
                    </Badge>
                  )}
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      </div>
                    </div>
                    {option.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Information about selected type */}
        {selectedOption && (
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium mb-1">About {selectedOption.label}</div>
                <div className="text-muted-foreground">
                  {selectedOption.value === 'digital' && (
                    "Your music will be available for streaming and digital download. No physical production or shipping required."
                  )}
                  {selectedOption.value === 'physical' && (
                    "Create physical media with unique unlock codes. Fans purchase physical copies and use codes to unlock digital access. Perfect for collectors and premium releases."
                  )}
                  {selectedOption.value === 'hybrid' && (
                    "Release both digitally and as physical media. Fans can stream immediately or purchase physical copies with unlock codes for the complete experience."
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Show unlock codes info for physical/hybrid */}
        {(value === 'physical' || value === 'hybrid') && (
          <div className="border border-blue-200 bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Disc className="h-4 w-4 mt-0.5 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 mb-1">
                  Physical Album Unlock System
                </div>
                <div className="text-blue-700">
                  You&rsquo;ll be able to generate unique unlock codes for your physical media. 
                  Fans can redeem these codes to access your music digitally on Shellff.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
