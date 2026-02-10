
/**
 * Data Sync Utility for BuildWise
 * Ensures all data (workers, materials, work entries) are properly tagged with project codes
 * so the Owner Portal can filter and display them correctly
 */


/**
 * Data Sync Utility for BuildWise
 * Ensures all data (workers, materials, work entries) are properly tagged with project codes
 * and isolated by User ID in localStorage.
 */

export class ProjectDataSync {
    /**
     * Get the current logged in user ID
     */
    static getUserId(): string | 'anonymous' {
        const userJson = localStorage.getItem('buildwise_user');
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                return user.id || 'anonymous';
            } catch (e) {
                return 'anonymous';
            }
        }
        return 'anonymous';
    }

    /**
     * Helper to get user-specific storage key
     */
    static getUserKey(baseKey: string): string {
        const userId = this.getUserId();
        return `buildwise_${userId}_${baseKey}`;
    }

    /**
     * Get the current active project code
     */
    static getCurrentProjectCode(): string | null {
        const userId = this.getUserId();
        const projectCode = localStorage.getItem(`buildwise_${userId}_current_project_code`);
        const projectId = localStorage.getItem(`buildwise_project_id`); // This one might be shared or need isolation too

        if (!projectCode && projectId) {
            // Try to find project code from projects list
            const projects = this.getProjects();
            const project = projects.find(p => p.id === projectId);
            if (project) {
                localStorage.setItem(`buildwise_${userId}_current_project_code`, project.access_code);
                return project.access_code;
            }
        }

        return projectCode;
    }

    /**
     * Get all projects from localStorage (isolated by user)
     */
    static getProjects(): any[] {
        const key = this.getUserKey('projects');
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save worker with project code (isolated by user)
     */
    static saveWorker(worker: any): void {
        const projectCode = this.getCurrentProjectCode();
        const workers = this.getWorkers();

        const workerWithCode = {
            ...worker,
            projectCode: projectCode,
            project_code: projectCode,
        };

        const existingIndex = workers.findIndex(w => w.id === worker.id);
        if (existingIndex >= 0) {
            workers[existingIndex] = workerWithCode;
        } else {
            workers.push(workerWithCode);
        }

        const key = this.getUserKey('workers');
        localStorage.setItem(key, JSON.stringify(workers));
        console.log('✅ Saved worker with project code:', projectCode);
    }

    /**
     * Save multiple workers with project code (isolated by user)
     */
    static saveWorkers(workers: any[]): void {
        const projectCode = this.getCurrentProjectCode();
        const allWorkers = this.getWorkers();

        // Filter out workers that belong to the current project
        const otherProjectWorkers = allWorkers.filter(w =>
            w.projectCode?.toUpperCase() !== projectCode?.toUpperCase() &&
            w.project_code?.toUpperCase() !== projectCode?.toUpperCase() &&
            w.projectCode && w.projectCode !== 'global'
        );

        // Tag new/updated workers with current project code
        const currentProjectWorkers = workers.map(w => ({
            ...w,
            projectCode: projectCode,
            project_code: projectCode,
        }));

        // Combine and save
        const finalWorkers = [...otherProjectWorkers, ...currentProjectWorkers];
        const key = this.getUserKey('workers');
        localStorage.setItem(key, JSON.stringify(finalWorkers));
        console.log(`✅ Saved ${currentProjectWorkers.length} workers for project:`, projectCode);
    }

    /**
     * Get all workers (isolated by user)
     */
    static getWorkers(): any[] {
        const key = this.getUserKey('workers');
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Get workers for current project (isolated by user)
     */
    static getProjectWorkers(): any[] {
        const projectCode = this.getCurrentProjectCode();
        if (!projectCode) return this.getWorkers();

        const allWorkers = this.getWorkers();
        return allWorkers.filter(w =>
            w.projectCode?.toUpperCase() === projectCode.toUpperCase() ||
            w.project_code?.toUpperCase() === projectCode.toUpperCase() ||
            !w.projectCode // Include workers without project code for backward compatibility
        );
    }

    /**
     * Save material with project code (isolated by user)
     */
    static saveMaterial(material: any): void {
        const projectCode = this.getCurrentProjectCode();
        const materials = this.getMaterials();

        const materialWithCode = {
            ...material,
            projectCode: projectCode,
            project_code: projectCode,
        };

        const existingIndex = materials.findIndex(m => m.id === material.id || m.name === material.name);
        if (existingIndex >= 0) {
            materials[existingIndex] = materialWithCode;
        } else {
            materials.push(materialWithCode);
        }

        const key = this.getUserKey('materials_actual');
        localStorage.setItem(key, JSON.stringify(materials));
        console.log('✅ Saved material with project code:', projectCode);
    }

    /**
     * Save multiple materials with project code (isolated by user)
     */
    static saveMaterials(materials: any[]): void {
        const projectCode = this.getCurrentProjectCode();
        const allMaterials = this.getMaterials();

        // Filter out materials that belong to the current project
        const otherProjectMaterials = allMaterials.filter(m =>
            m.projectCode?.toUpperCase() !== projectCode?.toUpperCase() &&
            m.project_code?.toUpperCase() !== projectCode?.toUpperCase() &&
            m.projectCode && m.projectCode !== 'global'
        );

        // Tag current project materials
        const currentProjectMaterials = materials.map(m => ({
            ...m,
            projectCode: projectCode,
            project_code: projectCode,
        }));

        // Combine and save
        const finalMaterials = [...otherProjectMaterials, ...currentProjectMaterials];
        const key = this.getUserKey('materials_actual');
        localStorage.setItem(key, JSON.stringify(finalMaterials));
        console.log(`✅ Saved ${currentProjectMaterials.length} materials for project:`, projectCode);
    }

    /**
     * Get all materials (isolated by user)
     */
    static getMaterials(): any[] {
        const key = this.getUserKey('materials_actual');
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Get materials for current project (isolated by user)
     */
    static getProjectMaterials(): any[] {
        const projectCode = this.getCurrentProjectCode();
        if (!projectCode) return this.getMaterials();

        const allMaterials = this.getMaterials();
        return allMaterials.filter(m =>
            m.projectCode?.toUpperCase() === projectCode.toUpperCase() ||
            m.project_code?.toUpperCase() === projectCode.toUpperCase() ||
            !m.projectCode
        );
    }

    /**
     * Save work entry with project code (isolated by user)
     */
    static saveWorkEntry(entry: any): void {
        const projectCode = this.getCurrentProjectCode();
        const entries = this.getWorkEntries();

        const entryWithCode = {
            ...entry,
            projectCode: projectCode,
            project_code: projectCode,
        };

        entries.push(entryWithCode);
        const key = this.getUserKey('work_entries');
        localStorage.setItem(key, JSON.stringify(entries));
        console.log('✅ Saved work entry with project code:', projectCode);
    }

    /**
     * Get all work entries (isolated by user)
     */
    static getWorkEntries(): any[] {
        const key = this.getUserKey('work_entries');
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Get work entries for current project (isolated by user)
     */
    static getProjectWorkEntries(): any[] {
        const projectCode = this.getCurrentProjectCode();
        if (!projectCode) return this.getWorkEntries();

        const allEntries = this.getWorkEntries();
        return allEntries.filter(e =>
            e.projectCode?.toUpperCase() === projectCode.toUpperCase() ||
            e.project_code?.toUpperCase() === projectCode.toUpperCase() ||
            !e.projectCode
        );
    }

    /**
     * Save scenario results with project code (isolated by user)
     */
    static saveScenarioResult(scenarioName: string, result: any): void {
        const projectCode = this.getCurrentProjectCode();
        const key = this.getUserKey('scenario_results');
        const stored = localStorage.getItem(key);
        const results = stored ? JSON.parse(stored) : {};

        // Save with project code as key
        results[projectCode || 'global'] = {
            ...result,
            projectCode: projectCode,
            scenarioName: scenarioName,
            savedAt: new Date().toISOString(),
        };

        localStorage.setItem(key, JSON.stringify(results));
        console.log('✅ Saved scenario result with project code:', projectCode);
    }

    /**
     * Get scenario results for current project (isolated by user)
     */
    static getScenarioResult(): any {
        const projectCode = this.getCurrentProjectCode();
        const key = this.getUserKey('scenario_results');
        const stored = localStorage.getItem(key);

        if (!stored) return null;

        const results = JSON.parse(stored);
        return results[projectCode || 'global'] || null;
    }

    /**
     * Migrate existing data to include project codes
     * Call this once when switching to the new system
     */
    static migrateExistingData(): void {
        const projectCode = this.getCurrentProjectCode();
        if (!projectCode) {
            console.warn('⚠️ No active project, skipping migration');
            return;
        }

        console.log('🔄 Starting data migration for project:', projectCode);

        // Migrate workers
        const workers = this.getWorkers();
        const workersNeedMigration = workers.filter(w => !w.projectCode && !w.project_code);
        if (workersNeedMigration.length > 0) {
            this.saveWorkers(workers);
            console.log(`✅ Migrated ${workersNeedMigration.length} workers`);
        }

        // Migrate materials
        const materials = this.getMaterials();
        const materialsNeedMigration = materials.filter(m => !m.projectCode && !m.project_code);
        if (materialsNeedMigration.length > 0) {
            this.saveMaterials(materials);
            console.log(`✅ Migrated ${materialsNeedMigration.length} materials`);
        }

        // Migrate work entries
        const entries = this.getWorkEntries();
        const entriesNeedMigration = entries.filter(e => !e.projectCode && !e.project_code);
        if (entriesNeedMigration.length > 0) {
            const migratedEntries = entries.map(e => ({
                ...e,
                projectCode: e.projectCode || projectCode,
                project_code: e.project_code || projectCode,
            }));
            const key = this.getUserKey('work_entries');
            localStorage.setItem(key, JSON.stringify(migratedEntries));
            console.log(`✅ Migrated ${entriesNeedMigration.length} work entries`);
        }

        console.log('✅ Data migration complete');
    }

    /**
     * Debug: Log current project data
     */
    static debugProjectData(): void {
        const projectCode = this.getCurrentProjectCode();
        const userId = this.getUserId();
        console.log('=== PROJECT DATA DEBUG ===');
        console.log('User ID:', userId);
        console.log('Current Project Code:', projectCode);
        console.log('Workers:', this.getWorkers());
        console.log('Project Workers:', this.getProjectWorkers());
        console.log('Materials:', this.getMaterials());
        console.log('Project Materials:', this.getProjectMaterials());
        console.log('Work Entries:', this.getWorkEntries());
        console.log('Project Work Entries:', this.getProjectWorkEntries());
        console.log('Scenario Result:', this.getScenarioResult());
        console.log('=========================');
    }
}

// Export convenience functions
export const getCurrentProjectCode = () => ProjectDataSync.getCurrentProjectCode();
export const saveWorker = (worker: any) => ProjectDataSync.saveWorker(worker);
export const saveWorkers = (workers: any[]) => ProjectDataSync.saveWorkers(workers);
export const getProjectWorkers = () => ProjectDataSync.getProjectWorkers();
export const saveMaterial = (material: any) => ProjectDataSync.saveMaterial(material);
export const saveMaterials = (materials: any[]) => ProjectDataSync.saveMaterials(materials);
export const getProjectMaterials = () => ProjectDataSync.getProjectMaterials();
export const saveWorkEntry = (entry: any) => ProjectDataSync.saveWorkEntry(entry);
export const getProjectWorkEntries = () => ProjectDataSync.getProjectWorkEntries();
export const saveScenarioResult = (name: string, result: any) => ProjectDataSync.saveScenarioResult(name, result);
export const getScenarioResult = () => ProjectDataSync.getScenarioResult();
export const migrateExistingData = () => ProjectDataSync.migrateExistingData();
export const debugProjectData = () => ProjectDataSync.debugProjectData();
