/**
 * Simple web server to serve the constraint collection interface
 * Integrates with the ConstraintCollectionInterface backend
 */

import * as path from 'path';
import * as fs from 'fs';
import { ConstraintCollectionInterface } from '../components/ConstraintCollectionInterface';
import { ConstraintUpdateManagerImpl } from '../components/ConstraintUpdateManager';
import { UserConstraints, UserConstraintUpdates, UserSession, ConstraintUpdateResult } from '../types';

/**
 * Web server for the Technical Referee Tool
 * Serves the constraint collection interface and handles API endpoints
 */
export class TechnicalRefereeWebServer {
  private constraintInterface: ConstraintCollectionInterface;
  private constraintUpdateManager: ConstraintUpdateManagerImpl;
  private sessions: Map<string, ConstraintCollectionInterface> = new Map();
  private userSessions: Map<string, UserSession> = new Map();

  constructor() {
    this.constraintInterface = new ConstraintCollectionInterface();
    this.constraintUpdateManager = new ConstraintUpdateManagerImpl();
  }

  /**
   * Create a new session for constraint collection
   */
  createSession(): string {
    const sessionId = this.generateSessionId();
    const sessionInterface = new ConstraintCollectionInterface();
    sessionInterface.startCollection();
    this.sessions.set(sessionId, sessionInterface);
    
    // Create corresponding user session for constraint updates
    const userSession: UserSession = {
      id: sessionId,
      constraints: {} as UserConstraints, // Will be populated when collection completes
      selectedOptions: [],
      evaluationHistory: [],
      createdAt: new Date()
    };
    this.userSessions.set(sessionId, userSession);
    this.constraintUpdateManager.setSession(sessionId, userSession);
    
    return sessionId;
  }

  /**
   * Get session interface
   */
  getSession(sessionId: string): ConstraintCollectionInterface | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Handle budget collection API endpoint
   */
  handleBudgetCollection(sessionId: string, budgetData: { budget: 'low' | 'medium' | 'high' }) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const result = session.collectBudget(budgetData);
    return {
      success: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      currentStep: session.getCurrentStep(),
      progress: session.getProgress()
    };
  }

  /**
   * Handle scale collection API endpoint
   */
  handleScaleCollection(sessionId: string, scaleData: { users: number; traffic: 'low' | 'medium' | 'high' }) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const result = session.collectScale(scaleData);
    return {
      success: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      currentStep: session.getCurrentStep(),
      progress: session.getProgress()
    };
  }

  /**
   * Handle team collection API endpoint
   */
  handleTeamCollection(sessionId: string, teamData: { skillLevel: 'junior' | 'mixed' | 'senior'; experience: string[] }) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const result = session.collectTeam(teamData);
    return {
      success: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      currentStep: session.getCurrentStep(),
      progress: session.getProgress()
    };
  }

  /**
   * Handle timeline collection API endpoint
   */
  handleTimelineCollection(sessionId: string, timelineData: { timeline: 'immediate' | 'short' | 'medium' | 'long' }) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const result = session.collectTimeline(timelineData);
    return {
      success: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      currentStep: session.getCurrentStep(),
      progress: session.getProgress()
    };
  }

  /**
   * Handle priorities collection API endpoint
   */
  handlePrioritiesCollection(sessionId: string, prioritiesData: {
    cost: number;
    performance: number;
    easeOfUse: number;
    scalability: number;
    vendorLockIn: number;
  }) {
    const session = this.getSession(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    const result = session.collectPriorities(prioritiesData);
    
    // If collection is complete, update the user session with complete constraints
    if (result.isValid) {
      const completeConstraints = session.getCompleteConstraints();
      if (completeConstraints) {
        const userSession = this.userSessions.get(sessionId);
        if (userSession) {
          userSession.constraints = completeConstraints;
          this.userSessions.set(sessionId, userSession);
          this.constraintUpdateManager.setSession(sessionId, userSession);
        }
      }
    }
    
    return {
      success: result.isValid,
      errors: result.errors,
      warnings: result.warnings,
      currentStep: session.getCurrentStep(),
      progress: session.getProgress(),
      constraints: result.isValid ? session.getCompleteConstraints() : null
    };
  }

  /**
   * Handle constraint update API endpoint
   * Requirement 6.3: Allow re-evaluation with updated parameters
   */
  async handleConstraintUpdate(sessionId: string, constraintUpdates: UserConstraintUpdates): Promise<any> {
    try {
      const result = await this.constraintUpdateManager.updateConstraints(sessionId, constraintUpdates);
      
      // Update the user session if successful
      if (result.success) {
        const userSession = this.userSessions.get(sessionId);
        if (userSession) {
          userSession.constraints = result.updatedConstraints;
          this.userSessions.set(sessionId, userSession);
        }
      }
      
      return {
        success: result.success,
        updatedConstraints: result.updatedConstraints,
        evaluationResult: result.evaluationResult,
        errors: result.errors,
        warnings: result.warnings,
        changesSummary: result.changesSummary
      };
    } catch (error) {
      return {
        success: false,
        error: `Constraint update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Handle priority update API endpoint
   */
  async handlePriorityUpdate(sessionId: string, newPriorities: UserConstraints['priorities']): Promise<any> {
    try {
      const result = await this.constraintUpdateManager.updatePriorities(sessionId, newPriorities);
      
      // Update the user session if successful
      if (result.success) {
        const userSession = this.userSessions.get(sessionId);
        if (userSession) {
          userSession.constraints = result.updatedConstraints;
          this.userSessions.set(sessionId, userSession);
        }
      }
      
      return {
        success: result.success,
        updatedConstraints: result.updatedConstraints,
        evaluationResult: result.evaluationResult,
        errors: result.errors,
        warnings: result.warnings,
        changesSummary: result.changesSummary
      };
    } catch (error) {
      return {
        success: false,
        error: `Priority update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get constraint modification history for a session
   */
  getConstraintHistory(sessionId: string): any {
    const history = this.constraintUpdateManager.getModificationHistory(sessionId);
    return {
      success: true,
      history: history.map(mod => ({
        timestamp: mod.timestamp,
        modifiedFields: mod.modifiedFields,
        previousValues: mod.previousValues,
        newValues: mod.newValues,
        reason: mod.reason
      }))
    };
  }

  /**
   * Validate constraint updates before applying
   */
  validateConstraintUpdates(sessionId: string, updates: UserConstraintUpdates): any {
    const userSession = this.userSessions.get(sessionId);
    if (!userSession) {
      return { success: false, error: 'Session not found' };
    }

    const validation = this.constraintUpdateManager.validateConstraintUpdates(userSession.constraints, updates);
    return {
      success: true,
      isValid: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings
    };
  }

  /**
   * Get complete constraints for a session
   */
  getCompleteConstraints(sessionId: string): UserConstraints | null {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return session.getCompleteConstraints();
  }

  /**
   * Get partial constraints for a session
   */
  getPartialConstraints(sessionId: string): Partial<UserConstraints> | null {
    const session = this.getSession(sessionId);
    if (!session) {
      return null;
    }

    return session.getPartialConstraints();
  }

  /**
   * Navigate to a specific step in the collection process
   */
  navigateToStep(sessionId: string, step: string): boolean {
    const session = this.getSession(sessionId);
    if (!session) {
      return false;
    }

    // Convert string to enum value
    const stepMap: Record<string, any> = {
      'budget': 'budget',
      'scale': 'scale', 
      'team': 'team',
      'timeline': 'timeline',
      'priorities': 'priorities',
      'complete': 'complete'
    };

    const stepEnum = stepMap[step];
    if (!stepEnum) {
      return false;
    }

    return session.goToStep(stepEnum);
  }

  /**
   * Get form options for dropdowns and validation
   */
  getFormOptions() {
    return this.constraintInterface.getFormOptions();
  }

  /**
   * Get priority ranking helpers
   */
  getPriorityHelpers() {
    return this.constraintInterface.getPriorityRankingHelpers();
  }

  /**
   * Serve static files (HTML, CSS, JS)
   */
  serveStaticFile(filePath: string): { content: string; contentType: string } | null {
    const webDir = path.join(__dirname);
    const fullPath = path.join(webDir, filePath);
    
    // Security check - ensure file is within web directory
    if (!fullPath.startsWith(webDir)) {
      return null;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const contentType = this.getContentType(filePath);
      return { content, contentType };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get content type for file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json'
    };
    return contentTypes[ext] || 'text/plain';
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  /**
   * Clean up expired sessions
   */
  cleanupSessions(): void {
    // In a real implementation, you would track session timestamps
    // and remove sessions that haven't been used recently
    // For now, we'll keep all sessions
  }
}

/**
 * Simple HTTP server implementation for demonstration
 * In a real application, you would use Express.js or similar
 */
export class SimpleHTTPServer {
  private server: TechnicalRefereeWebServer;
  private port: number;

  constructor(port: number = 3000) {
    this.server = new TechnicalRefereeWebServer();
    this.port = port;
  }

  /**
   * Start the server
   */
  start(): void {
    console.log(`Technical Referee Tool server starting on port ${this.port}`);
    console.log(`Open http://localhost:${this.port} to access the constraint collection interface`);
    
    // In a real implementation, you would set up actual HTTP routes here
    // This is just a demonstration of the server structure
  }

  /**
   * Handle HTTP requests (simplified for demonstration)
   */
  async handleRequest(method: string, url: string, body?: any): Promise<any> {
    // Parse URL and route to appropriate handler
    const urlParts = url.split('/').filter(part => part);
    
    if (method === 'GET' && urlParts.length === 0) {
      // Serve index.html
      return this.server.serveStaticFile('index.html');
    }
    
    if (method === 'GET' && urlParts[0] === 'api' && urlParts[1] === 'session') {
      // Create new session
      const sessionId = this.server.createSession();
      return { sessionId };
    }
    
    if (method === 'POST' && urlParts[0] === 'api' && urlParts[1] === 'collect') {
      const sessionId = body.sessionId;
      const step = urlParts[2];
      
      switch (step) {
        case 'budget':
          return this.server.handleBudgetCollection(sessionId, body.data);
        case 'scale':
          return this.server.handleScaleCollection(sessionId, body.data);
        case 'team':
          return this.server.handleTeamCollection(sessionId, body.data);
        case 'timeline':
          return this.server.handleTimelineCollection(sessionId, body.data);
        case 'priorities':
          return this.server.handlePrioritiesCollection(sessionId, body.data);
        default:
          return { success: false, error: 'Unknown collection step' };
      }
    }
    
    // Constraint update endpoints
    if (method === 'POST' && urlParts[0] === 'api' && urlParts[1] === 'update') {
      const sessionId = body.sessionId;
      const updateType = urlParts[2];
      
      switch (updateType) {
        case 'constraints':
          return await this.server.handleConstraintUpdate(sessionId, body.updates);
        case 'priorities':
          return await this.server.handlePriorityUpdate(sessionId, body.priorities);
        default:
          return { success: false, error: 'Unknown update type' };
      }
    }
    
    // Constraint validation endpoint
    if (method === 'POST' && urlParts[0] === 'api' && urlParts[1] === 'validate') {
      const sessionId = body.sessionId;
      return this.server.validateConstraintUpdates(sessionId, body.updates);
    }
    
    // Constraint history endpoint
    if (method === 'GET' && urlParts[0] === 'api' && urlParts[1] === 'history' && urlParts[2]) {
      const sessionId = urlParts[2];
      return this.server.getConstraintHistory(sessionId);
    }
    
    // Serve static files
    if (method === 'GET') {
      const filePath = urlParts.join('/');
      return this.server.serveStaticFile(filePath);
    }
    
    return { error: 'Not found' };
  }
}

// Export for use in other modules
export { ConstraintCollectionInterface, ConstraintUpdateManagerImpl };