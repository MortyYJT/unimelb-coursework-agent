## ADDED Requirements

### Requirement: Every entity has a validating schema
The system SHALL define a zod schema for each stored entity: Module, Course, Assessment, SourceItem, Task, Change, and Run. Every value written to storage or returned to an agent MUST pass its schema first.

#### Scenario: Valid entity is accepted
- **WHEN** a Task with an id, module id, title, and at least one step is parsed
- **THEN** parsing succeeds and returns a typed value

#### Scenario: Invalid entity is rejected with a path
- **WHEN** a Task without a title is parsed
- **THEN** parsing fails and the error names the `title` path

### Requirement: Modules are user-defined and delivery-type
A Module SHALL have an id, a name, a glyph, and a flag saying whether it is fed automatically by coursework sources. Module progress SHALL equal completed steps divided by all steps of its non-recurring tasks (decision #31).

#### Scenario: Progress of a module
- **WHEN** a module has two non-recurring tasks with 1 of 2 and 2 of 3 steps done, plus one recurring task
- **THEN** its progress is 3/5 and the recurring task does not count

#### Scenario: Module with no counted steps
- **WHEN** a module has no non-recurring tasks
- **THEN** its progress is 0, not NaN

### Requirement: Assessments carry weight, score, and hurdle floor
An Assessment SHALL belong to a Course and carry a kind (`ongoing`, `assignment`, `exam`), a weight in percent (0–100), an optional score in percent (0–100), an optional due date, an optional `hurdleMin` in percent, and a flag marking the final exam. The weights of one course's assessments MUST sum to 100 when the course is marked complete.

#### Scenario: Weight out of range
- **WHEN** an assessment with weight 120 is parsed
- **THEN** parsing fails

#### Scenario: Course weights do not add up
- **WHEN** a course marked complete has assessment weights summing to 95
- **THEN** validation fails with a message naming the course and the sum

### Requirement: Grade projection
The system SHALL compute, for a course: the graded weight, earned points, the current average over graded items, and the final-exam score needed to reach a target band. Ungraded non-final items SHALL be assumed to score the current average. When the final exam has `hurdleMin`, the needed score SHALL be at least `hurdleMin`. Bands are H1 80, H2A 75, H2B 70, H3 65, P 50.

#### Scenario: Needed final score
- **WHEN** graded items are 10% at 82, 15% at 88, and 10% at 74, an ungraded 25% assignment exists, the final is 40%, and the target is H1
- **THEN** earned is 28.8, the current average is 82.29 (to two decimals), and the needed final score is 76.6 (to one decimal)

#### Scenario: Hurdle sets the floor
- **WHEN** the same course has a final with `hurdleMin` 40, the assignment is graded 60, and the target is P
- **THEN** the needed final score is 40 and the result marks that the hurdle set it

#### Scenario: Out of reach and secured
- **WHEN** the computed need is above 100 or at most 0
- **THEN** the result reports `unreachable` or `secured` instead of a number

#### Scenario: Nothing graded yet
- **WHEN** a course has no graded items
- **THEN** the current average and needed score are both null

### Requirement: Tasks have steps, citations, and recurrence
A Task SHALL belong to a Module, optionally to a Course and an Assessment, and SHALL have one or more steps with an estimate in minutes and a done flag. A Task from a coursework source SHALL carry, on each step, at least one citation `{ sourceItemId, quote, locator }`. A manual Task SHALL carry no citations. A Task MAY repeat `daily` or `weekly`; a recurring Task has no due date.

#### Scenario: Coursework step without a citation
- **WHEN** a Task whose source is `coursework` has a step with no citation
- **THEN** validation fails

#### Scenario: Recurring task with a due date
- **WHEN** a Task has `repeat: "daily"` and a due date
- **THEN** validation fails

### Requirement: Changes and runs are recorded
A Change SHALL record its kind (`item.added`, `item.removed`, `content.changed`, `deadline.changed`, `grade.changed`), the affected entity, the before and after values where relevant, and a monotonically increasing sequence number. A Run SHALL record the command, start and end time, step count, outcome, and an optional cost reported by the caller.

#### Scenario: Sequence numbers increase
- **WHEN** two changes are recorded one after another
- **THEN** the second has a larger sequence number than the first
