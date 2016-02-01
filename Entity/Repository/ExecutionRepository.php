<?php

namespace JMose\CommandSchedulerBundle\Entity\Repository;

use JMose\CommandSchedulerBundle\Entity\Execution;
use \Doctrine\ORM\EntityRepository;

/**
 * ExecutionRepository
 *
 * This class was generated by the Doctrine ORM. Add your own custom
 * repository methods below.
 */
class ExecutionRepository extends EntityRepository
{
    /**
     * find all executions for a given command
     *
     * @param integer $commandId
     * @param boolean|false $returnAsObject set to true to return entity-objects instead of arrays
     *
     * @return array|object
     */
    public function findCommandExecutions($commandId, $returnAsObject = false)
    {
        $logs = $this->findBy(array('command' => $commandId), array('id' => 'ASC'));
        $result = array();

        // we need objects - no more work to do
        if ($returnAsObject) {
            return $logs;
        }

        /** @var Execution $log */
        foreach ($logs as $log) {
            array_push($result, array(
                'executionDate' => $log->getExecutionDate(),
                'runtime' => $log->getRuntime(),
                'returnCode' => $log->getReturnCode()
            ));
        }

        return $result;
    }

    public function deleteExecutionsForCommandsDateLimit($limit){
        $commands = $this->getCommandIds();
        foreach($commands as $commandId) {
            $executions = $this->getIdBoundary($limit, $commandId);

            // no or less than $limit executions found
            if (!$executions) {
                continue;
            }

            $lastId = $executions[0]->getId();

            $this->deleteExecutions($commandId, $lastId);
        }
    }

    /**
     * find all executions for command given by id, keep at most $limit
     *
     * @param int $limit number of executions to keep at most
     *
     * @return array
     */
    public function deleteExecutionsForCommandsKeepLimit($limit)
    {
        $commands = $this->getCommandIds();

        foreach ($commands as $commandId) {
            $executions = $this->getIdBoundary($limit, $commandId);

            // no or less than $limit executions found
            if (!$executions) {
                continue;
            }

            $lastId = $executions[0]->getId();

            $this->deleteExecutions($commandId, $lastId);
        }
    }

    /**
     * remove ALL executions
     *
     * @return mixed
     */
    public function truncateExecutions()
    {
        $deleted = $this->createQueryBuilder('execution')
            ->delete()
            ->getQuery()
            ->execute();

        return $deleted;
    }

    /**
     * fetch array of all commandids in execution log
     * @return mixed
     */
    protected function getCommandIds()
    {
        // "select distinct command from EXECUTION" is equal to
        // "select command from EXECUTION group by command"
        $commands = $this->createQueryBuilder('execution')
            ->groupBy('execution.command')
            ->getQuery()
            ->execute();

        // exchange Execution objects with command id
        $commands = array_map(function (Execution $e) {
            /** @var Execution $e */
            return $e->getCommand();
        }, $commands);

        return $commands;
    }

    /**
     * delete executions for a command with id smaller than limit
     *
     * @param integer $command Command ID
     * @param integer $lastId Execution ID
     */
    protected function deleteExecutions($command, $lastId)
    {
        $this->createQueryBuilder('execution')
            ->delete()
            ->where('execution.command = :cid')
            ->setParameter('cid', $command)
            ->andWhere('execution.id < :id')
            ->setParameter('id', $lastId)
            ->getQuery()
            ->execute();
    }

    /**
     * get ID of first execution to keep
     *
     * @param integer|string $limit
     * @param integer $commandId
     *
     * @return mixed
     */
    protected function getIdBoundary($limit, $commandId)
    {
        $queryBuilder = $this->createQueryBuilder('execution')
            ->where('execution.command = :cid')
            ->setParameter('cid', $commandId)
            ->orderBy('execution.id', 'DESC');

        if(is_numeric($limit)){
            $queryBuilder
                ->setFirstResult($limit - 1)
                ->setMaxResults($limit);

        } else if($limit instanceof \DateTime) {
            $queryBuilder
                ->andWhere($queryBuilder->expr()->lte('execution.executionDate', ':dateLimit'))
                ->setParameter('dateLimit', $limit, \Doctrine\DBAL\Types\Type::DATETIME);
        }

        $executions = $queryBuilder->getQuery()
            ->execute();

        return $executions;
    }
}
