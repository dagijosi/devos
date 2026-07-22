import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, Input, Button } from '../components/ui';
import { toast } from 'sonner';

const profileSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is too short"),
  location: z.string().optional(),
  bio: z.string().max(160, "Bio must be less than 160 characters"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const Profile = () => {
    
    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting } 
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: "DAGI",
            lastName: "User",
            email: "admin@dagi.com",
            phone: "",
            location: "",
            bio: "I am a developer who loves building robust and beautiful web applications."
        }
    });

    const onSubmit = async (data: ProfileFormData) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("Profile Data:", data);
        toast.success("Profile updated successfully!");
    };

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold text-theme-text mb-2">Profile Settings</h1>
                <p className="text-theme-text/60">Manage your account information and preferences.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info Card */}
                <div className="lg:col-span-2">
                    <Card
                        title="Personal Information"
                        description="Update your personal details here."
                        footer={
                            <div className="flex justify-end gap-3">
                                <Button variant="secondary">Cancel</Button>
                                <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>Save Changes</Button>
                            </div>
                        }
                    >
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input 
                                    label="First Name" 
                                    placeholder="John" 
                                    required
                                    {...register("firstName")}
                                    error={errors.firstName?.message}
                                />
                                <Input 
                                    label="Last Name" 
                                    placeholder="Doe" 
                                    required
                                    {...register("lastName")}
                                    error={errors.lastName?.message}
                                />
                                <Input 
                                    label="Email Address" 
                                    type="email" 
                                    placeholder="john@example.com" 
                                    className="md:col-span-2"
                                    required
                                    {...register("email")}
                                    error={errors.email?.message}
                                />
                                <Input 
                                    label="Phone Number" 
                                    placeholder="+1 (555) 000-0000" 
                                    required
                                    {...register("phone")}
                                    error={errors.phone?.message}
                                />
                                <Input 
                                    label="Location" 
                                    placeholder="San Francisco, CA" 
                                    {...register("location")}
                                    error={errors.location?.message}
                                />
                            </div>
                            
                            <div className="mt-6">
                                <label className="block text-sm font-medium text-theme-text mb-2">Bio</label>
                                <textarea 
                                    {...register("bio")}
                                    className="w-full bg-theme-background border border-theme-border rounded-xl px-4 py-3 text-theme-text placeholder:text-theme-text/40 focus:ring-1 focus:ring-theme-icon focus:border-theme-icon outline-none min-h-[100px]"
                                    placeholder="Tell us a little about yourself..."
                                />
                                {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* Avatar Card */}
                <div>
                    <Card title="Profile Picture" className="text-center">
                        <input 
                            type="file" 
                            id="avatar-upload" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    toast.success(`Selected file: ${file.name}`);
                                    // In a real app, you'd upload this file here
                                }
                            }}
                        />
                        <div className="relative w-32 h-32 mx-auto mb-6 group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                            <img 
                                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
                                alt="Profile" 
                                className="w-full h-full rounded-full object-cover border-4 border-theme-surface shadow-xl group-hover:opacity-80 transition-opacity" 
                            />
                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-bold">Change</span>
                            </div>
                            <button className="absolute bottom-0 right-0 bg-theme-icon text-white p-2 rounded-full shadow-lg hover:bg-theme-icon/90 transition-colors pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-sm text-theme-text/60 mb-6">
                            Allowed formats: JPG, PNG, GIF
                            <br />Max size: 2MB
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => document.getElementById('avatar-upload')?.click()}>Change Picture</Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Profile;
