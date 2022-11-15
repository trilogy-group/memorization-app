from aws_cdk import (
    # Duration,
    Stack,
    aws_ec2 as ec2,
    aws_ecs as ecs,
    aws_ecr as ecr,
    aws_ecs_patterns as ecs_patterns,
    Duration,
    Tags,
    aws_route53 as route53,
    aws_certificatemanager as acm,
    aws_route53_targets as targets,
)
from constructs import Construct


class EcsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        vpc = ec2.Vpc.from_lookup(self, "tu-vpc", vpc_id="vpc-0156cd9a85b4b3fac")
        sg = ec2.SecurityGroup(
            self,
            "memoryapp-cdk",
            allow_all_outbound=True,
            description="memoryapp tu2k22 ecs cdk deploy",
            vpc=vpc,
        )

        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP inbound rule",
        )
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS inbound rule",
        )
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(3000),
            description="Memoryapp HTTP inbound rule",
        )

        cluster = ecs.Cluster.from_cluster_attributes(
            self,
            "tu-ecs-cdk-cluster",
            cluster_name="tu2k22",
            vpc=vpc,
            security_groups=[sg],
        )

        lb_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "memoryapp-ecs",
            cluster=cluster,
            cpu=512,
            desired_count=1,
            min_healthy_percent=50,
            max_healthy_percent=200,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_ecr_repository(
                    ecr.Repository.from_repository_name(
                        self,
                        "memoryapp",
                        repository_name="memoryapp",
                    )
                ),
                container_port=3000,
                container_name="memoryapp",
            ),
            public_load_balancer=True,
            memory_limit_mib=1024,
            certificate=acm.Certificate.from_certificate_arn(
                self,
                "DomainCertificate",
                certificate_arn="arn:aws:acm:us-east-1:280022023954:certificate/24730ea7-b545-4a72-97fa-bbab39ef3b1f",
            ),
        )
        """
        scalable_target = lb_service.service.auto_scale_task_count(
            min_capacity=1, max_capacity=4
        )

        scalable_target.scale_on_cpu_utilization(
            "CpuScaling", target_utilization_percent=60
        )

        scalable_target.scale_on_memory_utilization(
            "MemoryScaling", target_utilization_percent=60
        )
        """

        route53.ARecord(
            self,
            "AliasRecord",
            record_name="memoryapp.tu2k22.devfactory.com",
            zone=route53.HostedZone.from_lookup(
                self, "HostedZone", domain_name="tu2k22.devfactory.com"
            ),
            ttl=Duration.minutes(1),
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(lb_service.load_balancer)
            ),
        )

        Tags.of(self).add("Owner", "Zhiyuan Gao")
        Tags.of(self).add("AD", "zhiyuangao")
        Tags.of(self).add("Email", "zhiyuan.gao@trilogy.com")
        Tags.of(self).add("Deletion advice", "Delete after GraphQL track")
        Tags.of(self).add("Project", "memoryapp")
        Tags.of(self).add("Quarter", "TU-22")
