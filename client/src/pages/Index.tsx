import SparkyChat from "@/components/SparkyChat";
import { usePreferences } from "@/contexts/PreferencesContext";
import { debug, info, warn, error } from "@/utils/logging";
import { apiCall } from "@/services/api";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import FoodDiary from "@/components/FoodDiary";
import FoodDatabaseManager from "@/components/FoodDatabaseManager";
import ExerciseDatabaseManager from "@/components/ExerciseDatabaseManager";
import { PresetExercise } from "@/types/workout.d"; // Import PresetExercise
import Reports from "@/components/Reports";
import AddComp from "@/components/AddComp";
import CheckIn from "@/components/CheckIn";
import Settings from "@/components/Settings";
import GoalsSettings from "@/components/GoalsSettings"; // Import GoalsSettings
import ThemeToggle from "@/components/ThemeToggle";
import ProfileSwitcher from "@/components/ProfileSwitcher";

import { useAuth } from "@/hooks/useAuth";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import GlobalNotificationIcon from "@/components/GlobalNotificationIcon";
import {
  Home,
  Activity, // Used for Check-In
  BarChart3,
  Utensils, // Used for Foods
  Settings as SettingsIcon,
  LogOut,
  Dumbbell, // Used for Exercises
  Target, // Used for Goals
  Shield,
  Plus,
  X, // Add X here for the close icon
} from "lucide-react";
import { LucideIcon } from "lucide-react"; // Import LucideIcon
import { toast } from "@/hooks/use-toast";
import AuthenticationSettings from "@/pages/Admin/AuthenticationSettings";
import BackupSettings from "@/pages/Admin/BackupSettings";
import UserManagement from "@/pages/Admin/UserManagement"; // Import UserManagement
import axios from "axios";
import OnBoarding from "@/components/Onboarding/OnBoarding";
import { getOnboardingStatus } from "@/services/onboardingService";

interface AddCompItem {
  value: string;
  label: string;
  icon: LucideIcon;
}

interface IndexProps {
  onShowAboutDialog: () => void;
}

const Index: React.FC<IndexProps> = ({ onShowAboutDialog }) => {
  const { t } = useTranslation();
  const { user, signOut, loading: authLoading } = useAuth();
  const {
    isActingOnBehalf,
    hasPermission,
    hasWritePermission,
    activeUserName,
  } = useActiveUser();
  const { loggingLevel } = usePreferences();
  debug(loggingLevel, "Index: Component rendered.");

  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  const [appVersion, setAppVersion] = useState("Loading...");
  const [isAddCompOpen, setIsAddCompOpen] = useState(false);
  const [exercisesToLogFromPreset, setExercisesToLogFromPreset] = useState<
    PresetExercise[] | undefined
  >(undefined);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const response = await axios.get("/api/version/current");
        setAppVersion(response.data.version);
      } catch (err) {
        console.error("Error fetching app version for footer:", err);
        setAppVersion("Error");
      }
    };
    fetchVersion();
  }, []);

  const { formatDateInUserTimezone } = usePreferences();
  const [selectedDate, setSelectedDate] = useState(
    formatDateInUserTimezone(new Date(), "yyyy-MM-dd")
  );
  const [activeTab, setActiveTab] = useState<string>("");
  const [foodDiaryRefreshTrigger, setFoodDiaryRefreshTrigger] = useState(0);

  useEffect(() => {
    debug(loggingLevel, "Index: Setting up foodDiaryRefresh event listener.");
    const handleRefresh = () => {
      info(
        loggingLevel,
        "Index: Received foodDiaryRefresh event, triggering refresh."
      );
      setFoodDiaryRefreshTrigger((prev) => prev + 1);
    };

    window.addEventListener("foodDiaryRefresh", handleRefresh);
    return () => {
      debug(
        loggingLevel,
        "Index: Cleaning up foodDiaryRefresh event listener."
      );
      window.removeEventListener("foodDiaryRefresh", handleRefresh);
    };
  }, [loggingLevel]);

  const handleSignOut = async () => {
    info(loggingLevel, "Index: Attempting to sign out.");
    try {
      await signOut();
      toast({
        title: "Success",
        description: "Signed out successfully",
      });
    } catch (err) {
      error(loggingLevel, "Index: Sign out error:", err);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (authLoading || !user) {
        if (!authLoading && !user) {
          setIsCheckingStatus(false);
        }
        return;
      }

      setIsCheckingStatus(true);
      try {
        const profile = await apiCall(`/auth/profiles`, {
          suppress404Toast: true,
        });
        setDisplayName(profile?.full_name || user.email || "");

        const { onboardingComplete } = await getOnboardingStatus();

        setNeedsOnboarding(!onboardingComplete);
      } catch (err) {
        error(
          loggingLevel,
          "Index: Error fetching profile or onboarding status:",
          err
        );
        setNeedsOnboarding(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkOnboardingStatus();
  }, [user, authLoading, loggingLevel]);

  const addCompItems: AddCompItem[] = useMemo(() => {
    const items: AddCompItem[] = [];
    if (!isActingOnBehalf) {
      items.push(
        { value: "checkin", label: "Check-In", icon: Activity },
        { value: "foods", label: "Foods", icon: Utensils },
        { value: "exercises", label: t('exercise.title', 'Exercises'), icon: Dumbbell },
        { value: "goals", label: "Goals", icon: Target }
      );
    } else {
      if (hasWritePermission("checkin")) {
        items.push({ value: "checkin", label: "Check-In", icon: Activity });
      }
    }
    return items;
  }, [isActingOnBehalf, hasWritePermission]);

  const availableMobileTabs = useMemo(() => {
    debug(loggingLevel, "Index: Calculating available tabs in mobile view.", {
      isActingOnBehalf,
      hasPermission,
      hasWritePermission,
      isAddCompOpen,
    });
    const mobileTabs = [];
    if (!isActingOnBehalf) {
      mobileTabs.push(
        { value: "home", label: t('nav.diary'), icon: Home },
        { value: "reports", label: t('nav.reports'), icon: BarChart3 },
        { value: "Add", label: t('common.add', 'Add'), icon: isAddCompOpen ? X : Plus },
        { value: "settings", label: t('nav.settings'), icon: SettingsIcon }
      );
    } else {
      if (hasWritePermission("calorie")) {
        mobileTabs.push({ value: "home", label: t('nav.diary'), icon: Home });
      }
      if (hasWritePermission("checkin")) {
        mobileTabs.push({
          value: "checkin",
          label: t('nav.checkin'),
          icon: Activity,
        });
      }
      if (hasPermission("reports")) {
        mobileTabs.push({
          value: "reports",
          label: t('nav.reports'),
          icon: BarChart3,
        });
      }
    }
    if (user?.role === "admin") {
      mobileTabs.push({ value: "admin", label: t('nav.admin'), icon: Shield });
    }
    return mobileTabs;
  }, [
    isActingOnBehalf,
    hasPermission,
    hasWritePermission,
    loggingLevel,
    user?.role,
    isAddCompOpen,
  ]);

  const availableTabs = useMemo(() => {
    debug(loggingLevel, "Index: Calculating available tabs.", {
      isActingOnBehalf,
      hasPermission,
      hasWritePermission,
    });
    const tabs = [];
    if (!isActingOnBehalf) {
      tabs.push(
        { value: "home", label: t('nav.diary'), icon: Home },
        { value: "checkin", label: t('nav.checkin'), icon: Activity },
        { value: "reports", label: t('nav.reports'), icon: BarChart3 },
        { value: "foods", label: t('nav.foods'), icon: Utensils },
        { value: "exercises", label: t('exercise.title', 'Exercises'), icon: Dumbbell },
        { value: "goals", label: t('nav.goals'), icon: Target },
        { value: "settings", label: t('nav.settings'), icon: SettingsIcon }
      );
    } else {
      if (hasWritePermission("calorie")) {
        tabs.push({ value: "home", label: t('nav.diary'), icon: Home });
      }
      if (hasWritePermission("checkin")) {
        tabs.push({ value: "checkin", label: t('nav.checkin'), icon: Activity });
      }
      if (hasPermission("reports")) {
        tabs.push({ value: "reports", label: t('nav.reports'), icon: BarChart3 });
      }
    }
    if (user?.role === "admin") {
      tabs.push({ value: "admin", label: t('nav.admin'), icon: Shield });
    }
    return tabs;
  }, [
    isActingOnBehalf,
    hasPermission,
    hasWritePermission,
    loggingLevel,
    user?.role,
  ]);

  useEffect(() => {
    if (user && availableTabs.length > 0 && !activeTab) {
      setActiveTab("home");
    } else if (availableTabs.length === 0 && activeTab) {
      setActiveTab("");
    }
  }, [availableTabs, activeTab, user]);

  useEffect(() => {
    if (user && availableMobileTabs.length > 0 && !activeTab) {
      setActiveTab("home");
    } else if (availableMobileTabs.length === 0 && activeTab) {
      setActiveTab("");
    }
  }, [availableMobileTabs, activeTab, user]);

  const handleNavigateFromAddComp = useCallback(
    (value: string) => {
      info(loggingLevel, `Index: Navigating to ${value} from AddComp.`);
      setActiveTab(value);
      setIsAddCompOpen(false);
    },
    [loggingLevel]
  );

  const getGridClass = (count: number) => {
    switch (count) {
      case 1:
        return "grid-cols-1";
      case 2:
        return "grid-cols-2";
      case 3:
        return "grid-cols-3";
      case 4:
        return "grid-cols-4";
      case 5:
        return "grid-cols-5";
      case 6:
        return "grid-cols-6";
      case 7:
        return "grid-cols-7";
      case 8:
        return "grid-cols-8";
      default:
        return "grid-cols-7";
    }
  };

  const gridClass = getGridClass(availableTabs.length);
  const mobileGridClass = getGridClass(availableMobileTabs.length);

  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-xl text-white">Loading...</p>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnBoarding onOnboardingComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen text-foreground relative overflow-hidden">
      {/* Mesh Gradient Background defined in index.css */}
      
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 relative z-10">
        <div className="flex justify-between items-center mb-6 glass p-4 rounded-2xl animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center gap-2"> 
            <img
              src="/images/SparkyFitness.png"
              alt="SparkyFitness Logo"
              className="h-10 w-auto drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
            />
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Pulse Fitness
            </h1>

          </div>
          <div className="flex items-center gap-2">
            <ProfileSwitcher />
            <span className="text-sm text-white/80 hidden sm:inline font-medium">
              Welcome {isActingOnBehalf ? activeUserName : displayName}
            </span>

            <GlobalNotificationIcon />
            {/* ThemeToggle hidden as Liquid Glass enforces dark mode */}
            {/* <ThemeToggle /> */} 
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:bg-white/10 text-white"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">
                Sign Out
              </span>
            </Button>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            if (value === "Add") {
              setIsAddCompOpen((prev) => !prev);
            } else {
              setIsAddCompOpen(false);
              setActiveTab(value);
            }
          }}
          className="space-y-6"
        >
          {/* Desktop Navigation - Premium Floating Glass Dock */}
          <TabsList className={`hidden sm:flex w-fit mx-auto gap-2 p-3 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_0_30px_rgba(139,92,246,0.3)] sticky top-4 z-40 animate-in slide-in-from-top-6 duration-700`}>
            {availableTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="group relative flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300 rounded-xl hover:bg-white/10 data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-[0_0_20px_rgba(147,51,234,0.5)] active:scale-95"
              >
                <Icon className={`h-4 w-4 transition-transform group-hover:scale-110 ${value === 'checkin' ? 'text-pink-400' : 'text-purple-300'} group-data-[state=active]:text-white`} />
                <span>{label}</span>
                {/* Active Indicator Dot */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Mobile Navigation - Floating Neon Glass Bar */}
          <TabsList
            className={`grid w-[95%] gap-1 fixed bottom-6 left-1/2 -translate-x-1/2 sm:hidden glass border border-white/20 rounded-3xl py-3 px-4 h-auto z-50 shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-3xl bg-black/60 ${mobileGridClass}`}
          >
            {availableMobileTabs.map(({ value, label, icon: Icon }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="flex flex-col items-center justify-center gap-1 p-2 rounded-2xl transition-all duration-300 data-[state=active]:bg-purple-500/80 data-[state=active]:text-white hover:bg-white/5 active:scale-90"
              >
                 <Icon className={`h-6 w-6 transition-all ${value === "Add" ? "text-pink-400" : (value === 'checkin' ? 'text-cyan-400' : 'text-slate-400')} data-[state=active]:text-white data-[state=active]:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]`} />
                 <span className="text-[10px] font-medium opacity-60 data-[state=active]:opacity-100">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="pb-24 sm:pb-0 min-h-[500px]">
            <TabsContent value="home" className="space-y-6 animate-in zoom-in-95 duration-500">
               {/* Wrap content in glass if needed, or let components handle their own glass styling */}
              <FoodDiary
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                refreshTrigger={foodDiaryRefreshTrigger}
                initialExercisesToLog={exercisesToLogFromPreset}
                onExercisesLogged={() => setExercisesToLogFromPreset(undefined)}
              />
            </TabsContent>
            <TabsContent value="checkin" className="space-y-6 animate-in zoom-in-95 duration-500">
              <CheckIn />
            </TabsContent>
            <TabsContent value="reports" className="space-y-6 animate-in zoom-in-95 duration-500">
              <Reports />
            </TabsContent>
            <TabsContent value="foods" className="space-y-6 animate-in zoom-in-95 duration-500">
              <FoodDatabaseManager />
            </TabsContent>
            <TabsContent value="exercises" className="space-y-6 animate-in zoom-in-95 duration-500">
              <ExerciseDatabaseManager
                onPresetExercisesSelected={setExercisesToLogFromPreset}
              />
            </TabsContent>
            <TabsContent value="goals" className="space-y-6 animate-in zoom-in-95 duration-500">
              <GoalsSettings />
            </TabsContent>
            <TabsContent value="settings" className="space-y-6 animate-in zoom-in-95 duration-500">
              <Settings onShowAboutDialog={onShowAboutDialog} />
            </TabsContent>
            {user?.role === "admin" && (
              <TabsContent value="admin" className="space-y-6 animate-in zoom-in-95 duration-500">
                <div className="flex flex-col space-y-4">
                  <AuthenticationSettings />
                  <BackupSettings />
                  <UserManagement />
                </div>
              </TabsContent>
            )}
          </div>
        </Tabs>

        <SparkyChat />
      </div>

      <AddComp
        isVisible={isAddCompOpen}
        onClose={() => setIsAddCompOpen(false)}
        items={addCompItems}
        onNavigate={handleNavigateFromAddComp}
      />

      <footer className="hidden sm:block text-center text-white/40 text-sm py-4">
        <p className="hover:text-white/80 transition-colors">
          Copyright &copy; 2025 Pulse Fitness
        </p>
      </footer>
    </div>
  );
};

export default Index;
