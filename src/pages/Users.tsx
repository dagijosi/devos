import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Badge, Table, TableCell, TableHead, TableHeader, TableRow, Button, Input, Modal, DeleteConfirmation, FilterDropdown, type FilterField } from '../components/ui';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'sonner';
import { usersData } from '../data';



const userSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["Admin", "Editor", "Viewer"]),
  status: z.enum(["Active", "Inactive"]),
});

type UserFormData = z.infer<typeof userSchema>;

const Users = () => {
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<typeof usersData[0] | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [filters, setFilters] = useState<Record<string, string>>({});
    
    const { 
        register, 
        handleSubmit, 
        formState: { errors, isSubmitting }, 
        reset 
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            role: 'Viewer',
            status: 'Active'
        }
    });

    const onSubmit = async (data: UserFormData) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log("Form Data:", data);
        toast.success("User created successfully!");
        setIsAddUserOpen(false);
        reset();
    };

    const handleDeleteUser = (user: typeof usersData[0]) => {
        setSelectedUser(user);
        setIsDeleteOpen(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(`User "${selectedUser?.name}" deleted successfully!`);
        setIsDeleting(false);
        setIsDeleteOpen(false);
        setSelectedUser(null);
    };

    const filterFields: FilterField[] = [
        {
            name: 'name',
            label: 'Name',
            type: 'text',
            placeholder: 'Search by name...'
        },
        {
            name: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'Search by email...'
        },
        {
            name: 'role',
            label: 'Role',
            type: 'select',
            options: [
                { value: 'Admin', label: 'Admin' },
                { value: 'Editor', label: 'Editor' },
                { value: 'Viewer', label: 'Viewer' }
            ]
        },
        {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
            ]
        }
    ];

    const handleApplyFilters = (newFilters: Record<string, string>) => {
        setFilters(newFilters);
        console.log('Applied filters:', newFilters);
        toast.success('Filters applied successfully!');
    };

    const handleResetFilters = () => {
        setFilters({});
        console.log('Filters reset');
        toast.info('Filters cleared');
    };

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-theme-surface p-6 rounded-2xl border border-theme-border shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-theme-text mb-1">User Management</h1>
                    <p className="text-sm text-theme-text/60">Manage system users, roles, and permissions.</p>
                </div>
                <div className="flex w-full sm:w-auto gap-3 flex-col sm:flex-row">
                    <FilterDropdown
                        fields={filterFields}
                        onApply={handleApplyFilters}
                        onReset={handleResetFilters}
                        initialValues={filters}
                        className="w-full sm:w-auto"
                    />
                    <Button onClick={() => setIsAddUserOpen(true)} leftIcon={<FaPlus size={14} />} className="w-full sm:w-auto">Add User</Button>
                </div>
            </div>

            {/* Table Section */}
                <Table
                    items={usersData}
                    renderMobileItem={(user) => (
                        <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-theme-icon to-purple-500 p-[1px] shadow-sm">
                                <div className="w-full h-full rounded-full bg-theme-surface flex items-center justify-center text-sm font-bold text-theme-text">
                                    {user.name.charAt(0)}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start gap-2">
                                    <div>
                                        <p className="font-medium text-theme-text">{user.name}</p>
                                        <p className="text-xs text-theme-text/50">{user.email}</p>
                                    </div>
                                    <div className="flex-shrink-0 text-right">
                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-border/20 text-theme-text">{user.role}</div>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={
                                            user.status === 'Active' ? 'success' : 
                                            user.status === 'Inactive' ? 'default' : 
                                            'warning'
                                        }>
                                            {user.status}
                                        </Badge>
                                        <span className="text-sm text-theme-text/60 font-mono">{user.lastLogin}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="p-2 text-theme-text/50 hover:text-theme-icon hover:bg-theme-icon/10 rounded-lg transition-all" title="Edit">
                                            <FaEdit size={14} />
                                        </button>
                                        <button 
                                            className="p-2 text-theme-text/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                                            title="Delete"
                                            onClick={() => handleDeleteUser(user)}
                                        >
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    renderRow={(user) => (
                        <TableRow key={user.id} className="hover:bg-theme-surface-active/30 transition-colors">
                            <TableCell className="py-4 pl-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-theme-icon to-purple-500 p-[1px] shadow-sm">
                                        <div className="w-full h-full rounded-full bg-theme-surface flex items-center justify-center text-sm font-bold text-theme-text">
                                            {user.name.charAt(0)}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-medium text-theme-text">{user.name}</p>
                                        <p className="text-xs text-theme-text/50">{user.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-theme-border/20 text-theme-text">
                                    {user.role}
                                </span>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    user.status === 'Active' ? 'success' : 
                                    user.status === 'Inactive' ? 'default' : 
                                    'warning'
                                }>
                                    {user.status}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <span className="text-sm text-theme-text/60 font-mono">{user.lastLogin}</span>
                            </TableCell>
                            <TableCell className="text-right pr-6">
                                <div className="flex justify-end gap-2">
                                    <button className="p-2 text-theme-text/50 hover:text-theme-icon hover:bg-theme-icon/10 rounded-lg transition-all" title="Edit">
                                        <FaEdit size={14} />
                                    </button>
                                    <button 
                                        className="p-2 text-theme-text/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all" 
                                        title="Delete"
                                        onClick={() => handleDeleteUser(user)}
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                >
                    <TableHeader className="bg-theme-surface-active/50">
                        <TableRow>
                            <TableHead className="py-4 pl-6">User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right pr-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                </Table>

            {/* Add User Modal */}
            <Modal
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                title="Add New User"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>Create User</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <p className="text-sm text-theme-text/60 mb-4">
                        Fill in the details below to create a new user account.
                    </p>
                    <div className="grid grid-cols-2 gap-4">
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
                    </div>
                    <Input 
                        label="Email Address" 
                        type="email" 
                        placeholder="john@example.com" 
                        required 
                        {...register("email")}
                        error={errors.email?.message}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-theme-text">Role <span className="text-red-500">*</span></label>
                            <select 
                                {...register("role")}
                                className="w-full bg-theme-background border border-theme-border rounded-xl px-4 py-2.5 text-theme-text outline-none focus:border-theme-icon focus:ring-1 focus:ring-theme-icon"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Editor">Editor</option>
                                <option value="Viewer">Viewer</option>
                            </select>
                            {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-theme-text">Status</label>
                            <select 
                                {...register("status")}
                                className="w-full bg-theme-background border border-theme-border rounded-xl px-4 py-2.5 text-theme-text outline-none focus:border-theme-icon focus:ring-1 focus:ring-theme-icon"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                            {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmation
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone and will remove all associated data."
                itemName={selectedUser?.name}
                isLoading={isDeleting}
            />


        </div>
    );
};

export default Users;
